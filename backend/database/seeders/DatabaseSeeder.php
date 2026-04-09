<?php

namespace Database\Seeders;

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

        foreach ($staffUsers as $data) {
            $user = User::firstOrCreate(
                ['email' => $data['email']],
                ['name' => $data['name'], 'password' => Hash::make('password')]
            );
            $user->syncRoles([$staff]);
        }

        $this->call(ShopScheduleSeeder::class);
    }
}
