<?php

namespace App\Http\Controllers;

use App\Models\Reservation;
use App\Models\Shop;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ShopController extends Controller
{
    public function index(): JsonResponse
    {
        $shops = Shop::with('images')->orderBy('id')->get();
        return response()->json($shops);
    }

    public function show(Shop $shop): JsonResponse
    {
        $shop->load('images');
        return response()->json($shop);
    }

    public function staff(Request $request, Shop $shop): JsonResponse
    {
        $date = $request->query('date');

        $query = $shop->staff();

        if ($date) {
            $startTime = $request->query('start_time');
            $endTime   = $request->query('end_time');

            $query->whereHas('schedules', function ($q) use ($shop, $date, $startTime, $endTime) {
                $q->where('shop_id', $shop->id)
                  ->where('date', $date)
                  ->where('is_day_off', false);

                if ($startTime) {
                    $q->where('start_time', '<=', $startTime);
                }
                if ($endTime) {
                    $q->where('end_time', '>=', $endTime);
                }
            });
        }

        $staff = $query->get()->map(fn($u) => [
            'id'                => $u->id,
            'name'              => $u->name,
            'profile_image_url' => $u->profile_image_url,
        ]);

        return response()->json($staff);
    }

    public function bookedSlots(Request $request, Shop $shop): JsonResponse
    {
        $from = $request->query('from', now()->toDateString());
        $to   = $request->query('to',   now()->addDays(13)->toDateString());

        $reservations = Reservation::where('shop_id', $shop->id)
            ->whereBetween('date', [$from, $to])
            ->where('status', 'confirmed')
            ->get(['date', 'start_time', 'end_time']);

        return response()->json($reservations);
    }

    public function schedules(Request $request, Shop $shop): JsonResponse
    {
        $from = $request->query('from', now()->toDateString());
        $to   = $request->query('to',   now()->addDays(13)->toDateString());

        $schedules = $shop->schedules()
            ->whereBetween('date', [$from, $to])
            ->where('is_day_off', false)
            ->get(['user_id', 'date', 'start_time', 'end_time']);

        return response()->json($schedules);
    }
}
