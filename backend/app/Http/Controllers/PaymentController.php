<?php

namespace App\Http\Controllers;

use App\Models\Course;
use App\Models\Shop;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Stripe\StripeClient;

class PaymentController extends Controller
{
    public function createIntent(Request $request, Shop $shop): JsonResponse
    {
        $data = $request->validate([
            'course_id' => 'required|integer|exists:courses,id',
        ]);

        $course = Course::findOrFail($data['course_id']);

        $stripe = new StripeClient(config('services.stripe.secret'));

        $intent = $stripe->paymentIntents->create([
            'amount'   => $course->price, // JPYは最小単位が1円なのでそのまま
            'currency' => 'jpy',
            'metadata' => [
                'shop_id'   => $shop->id,
                'course_id' => $course->id,
            ],
        ]);

        return response()->json(['client_secret' => $intent->client_secret]);
    }
}
