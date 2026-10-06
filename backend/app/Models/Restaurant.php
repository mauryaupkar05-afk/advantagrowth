<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Restaurant extends Model
{
    protected $fillable = [
        'name',
        'legal_name',
        'business_category',
        'vat_number',

        'address_line_1',
        'address_line_2',
        'city',
        'postal_code',
        'country',

        'slug',

        'phone',
        'email',
        'website',

        'currency',
        'timezone',
        'opening_time',
        'closing_time',

        'is_active',
    ];

    public function users(): HasMany
    {
        return $this->hasMany(User::class);
    }

    public function contactSettings(): HasOne
    {
        return $this->hasOne(RestaurantContactSetting::class);
    }

    public function contactMessages(): HasMany
    {
        return $this->hasMany(ContactMessage::class);
    }

    public function posConnections(): HasMany
    {
        return $this->hasMany(PosConnection::class);
    }

    public function posLocations(): HasMany
    {
        return $this->hasMany(PosLocation::class);
    }

    public function posSyncLogs(): HasMany
    {
        return $this->hasMany(PosSyncLog::class);
    }

    public function subscriptions(): HasMany
    {
        return $this->hasMany(RestaurantSubscription::class);
    }

    public function currentSubscription(): HasOne
    {
        return $this->hasOne(RestaurantSubscription::class)
            ->where('status', 'active')
            ->latestOfMany();
    }
}
