<?php

namespace Database\Seeders;

use App\Models\Course;
use App\Models\Shop;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\Models\Role;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    public function run(): void
    {
        // 店舗作成
        $shop = Shop::firstOrCreate(
            ['name' => 'Bodyshリンクスウメダ店'],
            [
                'address'     => '大阪府大阪市北区大深町１－１ヨドバシ梅田タワー７階',
                'phone'       => '06012341234',
                'description' => null,
            ]
        );

        // コース作成
        $courses = [
            ['name' => '60分コース', 'duration' => 60, 'price' => 7260, 'description' => '60分コースです。', 'sort_order' => 1],
            ['name' => '70分コース', 'duration' => 70, 'price' => 8470, 'description' => '70分コースです。', 'sort_order' => 2],
        ];

        foreach ($courses as $course) {
            Course::firstOrCreate(
                ['shop_id' => $shop->id, 'name' => $course['name']],
                [
                    'duration'    => $course['duration'],
                    'price'       => $course['price'],
                    'description' => $course['description'],
                    'is_active'   => true,
                    'sort_order'  => $course['sort_order'],
                ]
            );
        }

        // ロール作成
        $admin = Role::firstOrCreate(['name' => 'admin', 'guard_name' => 'web']);
        $staff = Role::firstOrCreate(['name' => 'staff', 'guard_name' => 'web']);

        // 管理者ユーザー作成
        $adminUser = User::firstOrCreate(
            ['email' => 'admin@example.com'],
            ['name' => '管理者', 'password' => Hash::make('password')]
        );
        $adminUser->syncRoles([$admin]);

        // スタッフユーザー作成
        $staffUsers = [
            ['name' => '野田',  'email' => 'noda@example.com'],
            ['name' => '高杉', 'email' => 'takasugi@example.com'],
            ['name' => '越',   'email' => 'koshi@example.com'],
            ['name' => '宮地', 'email' => 'miyachi@example.com'],
            ['name' => '清水', 'email' => 'shimizu@example.com'],
            ['name' => '月足', 'email' => 'tsukiashi@example.com'],
            ['name' => '下山', 'email' => 'shimoyama@example.com'],
            ['name' => '岩崎', 'email' => 'iwasaki@example.com'],
        ];

        $createdStaff = [];
        foreach ($staffUsers as $data) {
            $user = User::firstOrCreate(
                ['email' => $data['email']],
                ['name' => $data['name'], 'password' => Hash::make('password')]
            );
            $user->syncRoles([$staff]);
            $createdStaff[] = $user->id;
        }

        // スタッフを店舗に紐付け
        $shop->staff()->syncWithoutDetaching($createdStaff);

        $this->call(ShopScheduleSeeder::class);
    }
}
