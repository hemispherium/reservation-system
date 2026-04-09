<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Reservation extends Model
{
    protected $fillable = [
        'shop_id', 'course_id', 'user_id', 'staff_user_id',
        'guest_name', 'guest_email', 'guest_phone',
        'date', 'start_time', 'end_time',
        'status', 'note',
    ];

    public function shop()      { return $this->belongsTo(Shop::class); }
    public function course()    { return $this->belongsTo(Course::class); }
    public function user()      { return $this->belongsTo(User::class); }
    public function staffUser() { return $this->belongsTo(User::class, 'staff_user_id'); }
}
