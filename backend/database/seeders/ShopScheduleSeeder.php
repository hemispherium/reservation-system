<?php

namespace Database\Seeders;

use App\Models\Shop;
use App\Models\ShopUserSchedule;
use App\Models\User;
use Illuminate\Database\Seeder;

class ShopScheduleSeeder extends Seeder
{
    public function run(): void
    {
        $shop = Shop::first();
        if (!$shop) {
            $this->command->warn('店舗が存在しません。先に店舗を作成してください。');
            return;
        }

        $staffEmails = [
            'noda@example.com',
            'takasugi@example.com',
            'koshi@example.com',
            'miyachi@example.com',
            'shimizu@example.com',
            'tsukiashi@example.com',
            'shimoyama@example.com',
            'iwasaki@example.com',
        ];

        $staffUsers = User::whereIn('email', $staffEmails)->get();

        // 開始時間の選択肢
        $startOptions = ['09:00', '10:00', '11:00', '12:00'];
        // 終了時間の選択肢
        $endOptions   = ['17:00', '18:00', '19:00', '20:00', '21:00'];

        $records = [];

        foreach ($staffUsers as $user) {
            for ($day = 1; $day <= 30; $day++) {
                $date = sprintf('2026-04-%02d', $day);

                // 70%の確率で出勤
                $isDayOff = (random_int(1, 10) <= 3);

                $records[] = [
                    'shop_id'    => $shop->id,
                    'user_id'    => $user->id,
                    'date'       => $date,
                    'start_time' => $isDayOff ? null : $startOptions[array_rand($startOptions)],
                    'end_time'   => $isDayOff ? null : $endOptions[array_rand($endOptions)],
                    'is_day_off' => $isDayOff,
                ];
            }
        }

        // 既存データを削除してから挿入
        ShopUserSchedule::where('shop_id', $shop->id)
            ->whereIn('user_id', $staffUsers->pluck('id'))
            ->whereBetween('date', ['2026-04-01', '2026-04-30'])
            ->delete();

        foreach (array_chunk($records, 100) as $chunk) {
            ShopUserSchedule::insert($chunk);
        }

        $this->command->info(count($records) . ' 件のスケジュールを登録しました。');
    }
}
