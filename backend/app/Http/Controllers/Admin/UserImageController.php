<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Cloudinary\Cloudinary;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class UserImageController extends Controller
{
    public function __construct(private Cloudinary $cloudinary) {}

    public function update(Request $request, User $user): JsonResponse
    {
        $request->validate([
            'image' => 'required|image|max:5120',
        ]);

        // 既存画像を削除
        if ($user->profile_image_path) {
            $this->cloudinary->uploadApi()->destroy($user->profile_image_path);
        }

        $result = $this->cloudinary->uploadApi()->upload(
            $request->file('image')->getRealPath(),
            ['folder' => "reservation_system/" . trim(config('app.env')) . "/users/{$user->id}"]
        );

        $user->update(['profile_image_path' => $result['public_id']]);

        return response()->json(['profile_image_url' => $user->profile_image_url]);
    }

    public function destroy(User $user): JsonResponse
    {
        if ($user->profile_image_path) {
            $this->cloudinary->uploadApi()->destroy($user->profile_image_path);
            $user->update(['profile_image_path' => null]);
        }

        return response()->json(null, 204);
    }
}
