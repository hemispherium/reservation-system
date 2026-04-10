<?php

namespace App\Http\Controllers;

use App\Models\Course;
use App\Models\Reservation;
use App\Models\Shop;
use App\Models\ShopUserSchedule;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Stripe\StripeClient;


class ReservationController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Reservation::where('user_id', $request->user()->id)
            ->with(['shop:id,name', 'course:id,name,duration,price', 'staffUser:id,name']);

        if ($request->has('from') && $request->has('to')) {
            $query->whereBetween('date', [$request->query('from'), $request->query('to')]);
        }

        $reservations = $query->orderByDesc('date')->orderByDesc('start_time')->get();

        return response()->json($reservations);
    }

    public function store(Request $request, Shop $shop): JsonResponse
    {
        $data = $request->validate([
            'course_id'              => 'required|integer|exists:courses,id',
            'staff_user_id'          => 'nullable|integer|exists:users,id',
            'date'                   => 'required|date_format:Y-m-d',
            'start_time'             => 'required|date_format:H:i',
            'guest_name'             => 'required|string|max:255',
            'guest_email'            => 'required|email',
            'guest_phone'            => 'nullable|string|max:20',
            'note'                   => 'nullable|string',
            'stripe_payment_intent_id' => 'required|string',
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

        // 自分の予約との重複チェック（他店舗含む）
        $myOverlap = Reservation::where('user_id', $request->user()->id)
            ->where('date', $data['date'])
            ->where('status', 'confirmed')
            ->where('start_time', '<', $end->format('H:i'))
            ->where('end_time', '>', $data['start_time'])
            ->exists();

        if ($myOverlap) {
            return response()->json(['message' => 'この時間帯にはすでに別の予約があります。'], 422);
        }

        // 決済確認
        $stripe = new StripeClient(config('services.stripe.secret'));
        $intent = $stripe->paymentIntents->retrieve($data['stripe_payment_intent_id']);
        if ($intent->status !== 'succeeded') {
            return response()->json(['message' => '決済が完了していません。'], 422);
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
            'user_id'        => $request->user()->id,
            'staff_user_id'  => $staffUserId,
            'guest_name'     => $data['guest_name'],
            'guest_email'    => $data['guest_email'],
            'guest_phone'    => $data['guest_phone'] ?? null,
            'date'           => $data['date'],
            'start_time'     => $data['start_time'],
            'end_time'       => $end->format('H:i'),
            'status'                   => 'confirmed',
            'note'                     => $data['note'] ?? null,
            'stripe_payment_intent_id' => $data['stripe_payment_intent_id'],
        ]);

        return response()->json($reservation->load('course'), 201);
    }
}
