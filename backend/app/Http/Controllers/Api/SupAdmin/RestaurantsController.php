<?php

namespace App\Http\Controllers\Api\SupAdmin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Restaurant;
use App\Models\User;
use App\Models\Order;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;

class RestaurantsController extends Controller
{
    /**
     * Fetch (and cache) live exchange rates, quoted against USD.
     */
    private function getExchangeRates(): array
    {
        return Cache::remember('exchange_rates_usd', now()->addHours(12), function () {
            try {
                // Local WAMP PHP has no configured CA bundle (curl.cainfo), so SSL
                // verification is skipped for this public, non-sensitive, read-only rate feed.
                $response = Http::withOptions(['verify' => false])
                    ->timeout(5)
                    ->get('https://open.er-api.com/v6/latest/USD');

                if ($response->successful() && $response->json('result') === 'success') {
                    return $response->json('rates') ?? [];
                }
            } catch (\Exception $e) {
                // fall through to empty rates below
            }

            return [];
        });
    }

    /**
     * Convert an amount from one currency to another using USD-based rates.
     * Falls back to the original amount if either currency's rate is unavailable.
     */
    private function convertCurrency(float $amount, string $from, string $to, array $rates): float
    {
        if ($from === $to) {
            return $amount;
        }

        if (!isset($rates[$from]) || !isset($rates[$to])) {
            return $amount;
        }

        $usdAmount = $amount / $rates[$from];
        return $usdAmount * $rates[$to];
    }

    /**
     * Dashboard KPI stats.
     */
    public function stats(Request $request)
    {
        try {
            $targetCurrency = strtoupper($request->query('currency', 'INR'));
            $rates = $this->getExchangeRates();

            $totalRestaurants = Restaurant::count();
            $activeRestaurants = Restaurant::where('is_active', true)->count();
            $inactiveRestaurants = Restaurant::where('is_active', false)->count();

            // "Total Revenue" reflects real order revenue across all restaurants —
            // the same figure the Top Performing Restaurants table is ranked by.
            $restaurantCurrencies = Restaurant::pluck('currency', 'id');
            $paidOrders = Order::where('payment_status', 'paid')->get(['restaurant_id', 'total']);

            $totalRevenue = $paidOrders->sum(function ($order) use ($restaurantCurrencies, $targetCurrency, $rates) {
                $fromCurrency = strtoupper($restaurantCurrencies->get($order->restaurant_id) ?: 'INR');

                return $this->convertCurrency(
                    (float) $order->total,
                    $fromCurrency,
                    $targetCurrency,
                    $rates
                );
            });

            return response()->json([
                'success' => true,
                'data' => [
                    'total_restaurants' => $totalRestaurants,
                    'active_restaurants' => $activeRestaurants,
                    'inactive_restaurants' => $inactiveRestaurants,
                    'total_revenue' => round($totalRevenue, 2),
                    'currency' => $targetCurrency,
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch dashboard stats.',
            ], 500);
        }
    }

    /**
     * Revenue trend for the dashboard chart — for each day in the range, the
     * total real paid-order revenue placed on or before that day, compared
     * against the same point one period earlier. Same revenue basis as
     * stats() / topPerforming() so all three stay consistent.
     */
    public function revenueTrend(Request $request)
    {
        try {
            $days = max(1, (int) $request->query('days', 30));
            $targetCurrency = strtoupper($request->query('currency', 'INR'));
            $rates = $this->getExchangeRates();

            $restaurantCurrencies = Restaurant::pluck('currency', 'id');
            $paidOrders = Order::where('payment_status', 'paid')->get(['restaurant_id', 'total', 'created_at']);

            $convertedTotal = function ($order) use ($restaurantCurrencies, $targetCurrency, $rates) {
                $fromCurrency = strtoupper($restaurantCurrencies->get($order->restaurant_id) ?: 'INR');

                return $this->convertCurrency(
                    (float) $order->total,
                    $fromCurrency,
                    $targetCurrency,
                    $rates
                );
            };

            $today = now()->startOfDay();
            $series = [];

            for ($i = $days - 1; $i >= 0; $i--) {
                $date = $today->copy()->subDays($i);
                $cutoff = $date->copy()->endOfDay();
                $previousCutoff = $date->copy()->subDays($days)->endOfDay();

                $currentTotal = $paidOrders
                    ->filter(fn ($o) => $o->created_at->lte($cutoff))
                    ->sum($convertedTotal);

                $previousTotal = $paidOrders
                    ->filter(fn ($o) => $o->created_at->lte($previousCutoff))
                    ->sum($convertedTotal);

                $series[] = [
                    'date' => $date->format('Y-m-d'),
                    'current' => round($currentTotal, 2),
                    'previous' => round($previousTotal, 2),
                ];
            }

            return response()->json([
                'success' => true,
                'data' => $series,
                'currency' => $targetCurrency,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch revenue trend.',
            ], 500);
        }
    }

    /**
     * Top performing restaurants, ranked by paid order revenue.
     */
    public function topPerforming(Request $request)
    {
        try {
            $targetCurrency = strtoupper($request->query('currency', 'INR'));
            $limit = max(1, (int) $request->query('limit', 5));
            $rates = $this->getExchangeRates();

            $restaurants = Restaurant::with(['users' => function ($query) {
                $query->where('role', 'owner');
            }])->get();

            $ranked = $restaurants->map(function ($restaurant) use ($targetCurrency, $rates) {
                $ordersQuery = Order::where('restaurant_id', $restaurant->id);
                $ordersCount = (clone $ordersQuery)->count();
                $paidTotal = (clone $ordersQuery)->where('payment_status', 'paid')->sum('total');

                $revenue = $this->convertCurrency(
                    (float) $paidTotal,
                    strtoupper($restaurant->currency ?: 'INR'),
                    $targetCurrency,
                    $rates
                );

                $owner = $restaurant->users->first();

                return [
                    'id' => $restaurant->id,
                    'name' => $restaurant->name,
                    'owner' => $owner->owner_name ?? '—',
                    'orders_count' => $ordersCount,
                    'revenue' => round($revenue, 2),
                    'is_active' => (bool) $restaurant->is_active,
                    'days_active' => (int) $restaurant->created_at->diffInDays(now()),
                ];
            })
                ->sortByDesc('revenue')
                ->take($limit)
                ->values();

            return response()->json([
                'success' => true,
                'data' => $ranked,
                'currency' => $targetCurrency,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch top performing restaurants.',
            ], 500);
        }
    }

    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        try {
            $data = Restaurant::with(['users' => function ($query) {
                $query->where('role', 'owner');
            }])->latest()->get();

            return response()->json([
                'success' => true,
                'message' => 'Restaurants fetched successfully',
                'data' => $data,
            ]);
        } catch (\Exception $e) {
            Log::error('Superadmin failed to fetch restaurants: ' . $e->getMessage(), [
                'exception' => $e,
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch restaurants. Please try again.',
            ], 500);
        }
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $req)
    {
        $validate = $req->validate([
            'name' => 'required|string|max:255',
            'legal_name' => 'nullable|string|max:255',
            'business_category' => 'nullable|string|max:255',
            'vat_number' => 'nullable|string|max:255',
            'address_line_1' => 'nullable|string|max:255',
            'address_line_2' => 'nullable|string|max:255',
            'city' => 'nullable|string|max:255',
            'postal_code' => 'nullable|string|max:30',
            'country' => 'nullable|string|max:100',
            'phone' => 'required|string|max:20',
            'email' => 'required|email|max:255|unique:restaurants,email|unique:users,email',
            'password' => 'required|string|min:6',
            'website' => 'nullable|string|max:255',
            'currency' => 'nullable|string|max:10',
            'timezone' => 'nullable|string|max:100',
            'opening_time' => 'nullable|date_format:H:i',
            'closing_time' => 'nullable|date_format:H:i',
        ]);

        $password = $validate['password'];
        unset($validate['password']);
        $validate['email'] = strtolower(trim($validate['email']));
        $validate['slug'] = Str::slug($validate['name']) . '-' . Str::lower(Str::random(8));
        $validate['is_active'] = true;

        try {
            $restaurant = DB::transaction(function () use ($validate, $password) {
                $restaurant = Restaurant::create($validate);

                $ownerName = !empty($validate['legal_name']) ? trim($validate['legal_name']) : trim($validate['name']);
                User::create([
                    'restaurant_id' => $restaurant->id,
                    'owner_name' => $ownerName,
                    'email' => $validate['email'],
                    'phone' => trim($validate['phone']),
                    'password' => Hash::make($password),
                    'role' => 'owner',
                    'is_active' => true,
                    'email_verified_at' => now(),
                ]);

                return $restaurant;
            });

            return response()->json([
                'success' => true,
                'message' => 'Restaurant created successfully',
                'data' => $restaurant,
            ], 201);
        } catch (\Exception $e) {
            Log::error('Superadmin restaurant creation failed: ' . $e->getMessage(), [
                'exception' => $e,
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to create restaurant: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        try {
            $restaurant = Restaurant::with(['users' => function ($query) {
                $query->where('role', 'owner');
            }])->find($id);

            if (!$restaurant) {
                return response()->json([
                    'success' => false,
                    'message' => 'Restaurant not found',
                ], 404);
            }

            return response()->json([
                'success' => true,
                'message' => 'Restaurant fetched successfully',
                'data' => $restaurant,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch restaurant. Please try again.',
            ], 500);
        }
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $req, string $id)
    {
        $restaurant = Restaurant::with(['users' => function ($query) {
            $query->where('role', 'owner');
        }])->find($id);

        if (!$restaurant) {
            return response()->json([
                'success' => false,
                'message' => 'Restaurant not found',
            ], 404);
        }

        $ownerUser = $restaurant->users->first();
        $ownerUserId = $ownerUser?->id;

        $uniqueEmailRule = 'required|email|max:255|unique:restaurants,email,' . $id;
        if ($ownerUserId) {
            $uniqueEmailRule .= '|unique:users,email,' . $ownerUserId;
        } else {
            $uniqueEmailRule .= '|unique:users,email';
        }

        $validate = $req->validate([
            'name' => 'required|string|max:255',
            'legal_name' => 'nullable|string|max:255',
            'business_category' => 'nullable|string|max:255',
            'vat_number' => 'nullable|string|max:255',
            'address_line_1' => 'nullable|string|max:255',
            'address_line_2' => 'nullable|string|max:255',
            'city' => 'nullable|string|max:255',
            'postal_code' => 'nullable|string|max:30',
            'country' => 'nullable|string|max:100',
            'phone' => 'required|string|max:20',
            'email' => $uniqueEmailRule,
            'password' => 'nullable|string|min:6',
            'website' => 'nullable|string|max:255',
            'currency' => 'nullable|string|max:10',
            'timezone' => 'nullable|string|max:100',
            'opening_time' => 'nullable|date_format:H:i',
            'closing_time' => 'nullable|date_format:H:i',
        ]);

        $newPassword = !empty($validate['password']) ? $validate['password'] : null;
        unset($validate['password']);
        $validate['email'] = strtolower(trim($validate['email']));

        try {
            DB::transaction(function () use ($restaurant, $ownerUser, $validate, $newPassword) {
                $restaurant->update($validate);

                if ($ownerUser) {
                    $userUpdates = [
                        'email' => $validate['email'],
                        'phone' => trim($validate['phone']),
                    ];
                    if (!empty($validate['legal_name'])) {
                        $userUpdates['owner_name'] = trim($validate['legal_name']);
                    }
                    if ($newPassword) {
                        $userUpdates['password'] = Hash::make($newPassword);
                    }
                    $ownerUser->update($userUpdates);
                } elseif ($newPassword) {
                    $ownerName = !empty($validate['legal_name']) ? trim($validate['legal_name']) : trim($validate['name']);
                    User::create([
                        'restaurant_id' => $restaurant->id,
                        'owner_name' => $ownerName,
                        'email' => $validate['email'],
                        'phone' => trim($validate['phone']),
                        'password' => Hash::make($newPassword),
                        'role' => 'owner',
                        'is_active' => true,
                        'email_verified_at' => now(),
                    ]);
                }
            });

            return response()->json([
                'success' => true,
                'message' => 'Restaurant updated successfully',
                'data' => $restaurant->fresh(),
            ]);
        } catch (\Exception $e) {
            Log::error('Superadmin restaurant update failed: ' . $e->getMessage(), [
                'exception' => $e,
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to update restaurant: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Toggle the active/blocked status of the specified resource.
     */
    public function toggleStatus(string $id)
    {
        $restaurant = Restaurant::find($id);
        if (!$restaurant) {
            return response()->json([
                'success' => false,
                'message' => 'Restaurant not found',
            ], 404);
        }

        try {
            $restaurant->is_active = !$restaurant->is_active;
            $restaurant->save();

            return response()->json([
                'success' => true,
                'message' => $restaurant->is_active ? 'Restaurant unblocked successfully' : 'Restaurant blocked successfully',
                'is_active' => $restaurant->is_active,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update restaurant status. Please try again.',
            ], 500);
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        $restaurant = Restaurant::find($id);
        if (!$restaurant) {
            return response()->json([
                'success' => false,
                'message' => 'Restaurant not found',
            ], 404);
        }

        try {
            DB::transaction(function () use ($restaurant) {
                User::where('restaurant_id', $restaurant->id)->delete();
                $restaurant->delete();
            });

            return response()->json([
                'success' => true,
                'message' => 'Restaurant deleted successfully',
            ]);
        } catch (\Exception $e) {
            Log::error('Superadmin restaurant deletion failed: ' . $e->getMessage(), [
                'exception' => $e,
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to delete restaurant. Please try again.',
            ], 500);
        }
    }
}
