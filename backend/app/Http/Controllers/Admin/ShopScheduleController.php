<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Shop;
use App\Models\ShopUserSchedule;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ShopScheduleController extends Controller
{
    // 指定期間のスケジュール一覧（スタッフ別）
    public function index(Request $request, Shop $shop): JsonResponse
    {
        $from = $request->query('from', now()->startOfMonth()->toDateString());
        $to   = $request->query('to',   now()->endOfMonth()->toDateString());

        $schedules = $shop->schedules()
            ->whereBetween('date', [$from, $to])
            ->orderBy('date')
            ->get()
            ->groupBy('user_id');

        $result = $shop->staff()->get()->map(fn(User $user) => [
            'user_id'   => $user->id,
            'name'      => $user->name,
            'schedules' => $schedules->get($user->id, collect())->values(),
        ]);

        return response()->json($result);
    }

    // 1件追加・更新
    public function upsert(Request $request, Shop $shop, User $user): JsonResponse
    {
        $data = $request->validate([
            'date'       => 'required|date_format:Y-m-d',
            'is_day_off' => 'required|boolean',
            'start_time' => 'nullable|date_format:H:i',
            'end_time'   => 'nullable|date_format:H:i',
        ]);

        $schedule = ShopUserSchedule::updateOrCreate(
            ['shop_id' => $shop->id, 'user_id' => $user->id, 'date' => $data['date']],
            [
                'is_day_off' => $data['is_day_off'],
                'start_time' => $data['is_day_off'] ? null : ($data['start_time'] ?? null),
                'end_time'   => $data['is_day_off'] ? null : ($data['end_time'] ?? null),
            ]
        );

        return response()->json($schedule);
    }

    // 1件削除
    public function destroy(Shop $shop, User $user, string $date): JsonResponse
    {
        ShopUserSchedule::where('shop_id', $shop->id)
            ->where('user_id', $user->id)
            ->where('date', $date)
            ->delete();

        return response()->json(null, 204);
    }
}
