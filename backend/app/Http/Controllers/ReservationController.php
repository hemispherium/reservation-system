<?php

namespace App\Http\Controllers;

use App\Models\Course;
use App\Models\Reservation;
use App\Models\Shop;
use App\Models\ShopUserSchedule;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ReservationController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $reservations = Reservation::where('user_id', $request->user()->id)
            ->with(['shop:id,name', 'course:id,name,duration,price', 'staffUser:id,name'])
            ->orderByDesc('date')
            ->orderByDesc('start_time')
            ->get();

        return response()->json($reservations);
    }

    public function store(Request $request, Shop $shop): JsonResponse
    {
        $data = $request->validate([
            'course_id'      => 'required|integer|exists:courses,id',
            'staff_user_id'  => 'nullable|integer|exists:users,id',
            'date'           => 'required|date_format:Y-m-d',
            'start_time'     => 'required|date_format:H:i',
            'guest_name'     => 'required|string|max:255',
            'guest_email'    => 'required|email',
            'guest_phone'    => 'nullable|string|max:20',
            'note'           => 'nullable|string',
        ]);

        $course = Course::findOrFail($data['course_id']);
        $start  = \Carbon\Carbon::createFromFormat('H:i', $data['start_time']);
        $end    = $start->copy()->addMinutes($course->duration);

        // 重複チェック：同じ店舗・日付・時間帯に既存予約がないか
        $overlap = Reservation::where('shop_id', $shop->id)
            ->where('date', $data['date'])
            ->where('status', 'confirmed')
            ->where('start_time', '<', $end->format('H:i'))
            ->where('end_time', '>', $data['start_time'])
            ->exists();

        if ($overlap) {
            return response()->json(['message' => 'この時間帯はすでに予約が入っています。'], 422);
        }

        // トークンがあればユーザーを解決（任意認証）
        $userId = null;
        $token = $request->bearerToken();
        if ($token) {
            $userId = \Laravel\Sanctum\PersonalAccessToken::findToken($token)?->tokenable_id;
        }

        // 指名なしの場合、その時間帯に出勤しているスタッフをランダムに割り振る
        $staffUserId = $data['staff_user_id'] ?? null;
        if (!$staffUserId) {
            $workingStaffId = ShopUserSchedule::where('shop_id', $shop->id)
                ->where('date', $data['date'])
                ->where('is_day_off', false)
                ->where('start_time', '<=', $data['start_time'])
                ->where('end_time', '>=', $end->format('H:i'))
                ->inRandomOrder()
                ->value('user_id');
            $staffUserId = $workingStaffId;
        }

        $reservation = Reservation::create([
            'shop_id'        => $shop->id,
            'course_id'      => $course->id,
            'user_id'        => $userId,
            'staff_user_id'  => $staffUserId,
            'guest_name'     => $data['guest_name'],
            'guest_email'    => $data['guest_email'],
            'guest_phone'    => $data['guest_phone'] ?? null,
            'date'           => $data['date'],
            'start_time'     => $data['start_time'],
            'end_time'       => $end->format('H:i'),
            'status'         => 'confirmed',
            'note'           => $data['note'] ?? null,
        ]);

        return response()->json($reservation->load('course'), 201);
    }
}
