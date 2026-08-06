<script setup lang="ts">
import { onMounted } from "vue";

import birthdayCakeImage from "@/assets/images/stock/birthday_cake.jpg";
import chiffonCakeImage from "@/assets/images/stock/Chiffon.jpg";
import cookiesImage from "@/assets/images/stock/cookies.jpg";
import hampersImage from "@/assets/images/stock/hampers.webp";
import heroImage from "@/assets/images/stock/hero.jpg";

onMounted(() => {
  document.title = "LnQ Cake & Cookies | Home";
});

const categories = [
  {
    name: "Birthday Cakes",
    description:
      "Classic layer cakes with refined finishes for milestone celebrations.",
    imageUrl: birthdayCakeImage,
  },
  {
    name: "Cakes",
    description: "Delicious cakes for all occasions.",
    imageUrl: chiffonCakeImage,
  },
  {
    name: "Cookies",
    description: "Buttery, crisp, and elegantly packaged.",
    imageUrl: cookiesImage,
  },
  {
    name: "Dessert Boxes",
    description: "Curated assortments for gifting and intimate gatherings.",
    imageUrl: hampersImage,
  },
];
</script>

<template>
  <div>
    <!-- Hero -->
    <section class="pt-25">
      <div class="container grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
        <div>
          <small
class="inline-block px-3 py-1 mb-6 text-xs" :style="{
            background: 'var(--color-secondary)',
            color: 'white',
            borderRadius: '999px',
          }">Handcrafted Since 2024</small>

          <h1 style="color: var(--color-heading)">
            Cakes Crafted for Beautiful Celebrations.
          </h1>

          <p class="mt-6 text-lg" style="color: var(--color-text)">
            Small-batch, artisan cakes and delicate cookies crafted with the
            finest ingredients. Each order is hand-finished to create elegant
            desserts for your most memorable moments.
          </p>

          <div class="mt-8 flex items-center gap-4">
            <button class="btn btn-primary">Order Now</button>
            <button class="btn btn-secondary">View Collection</button>
          </div>
        </div>

        <div>
          <img
class="card image overflow-hidden" style="height: 420px; box-shadow: var(--shadow-lg)" :src="heroImage"
            alt="Hero Image" />
        </div>
      </div>
    </section>

    <!-- Featured Categories -->
    <section>
      <div class="container">
        <h2 class="mb-8">Featured Categories</h2>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div v-for="category in categories" :key="category.name" class="card p-4">
            <img class="image" style="width: 100%; height: 160px" :src="category.imageUrl" :alt="category.name" />
            <h4 class="mt-4">{{ category.name }}</h4>
            <p class="mt-2 text-sm text-muted">
              {{ category.description }}
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- Best Sellers -->
    <section>
      <div class="container">
        <div class="flex items-center justify-between mb-6">
          <h2>Best Sellers</h2>
          <a href="#" class="text-sm" style="color: var(--color-primary)">View all</a>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div class="card p-4">
            <div
class="image" style="
                height: 180px;
                background-image: url(&quot;https://images.unsplash.com/photo-1600180758890-4c7d5adb5b57?q=80&w=1200&auto=format&fit=crop&ixlib=rb-4.0.3&s=5a2d6b8c1d3e4f7a&quot;);
                background-size: cover;
                background-position: center;
              "></div>
            <h4 class="mt-4">Vanilla Layer Cake</h4>
            <p class="mt-2 text-sm text-muted">
              Hand-whipped vanilla buttercream
            </p>
            <div class="mt-4 flex items-center justify-between">
              <div>
                <div class="font-medium">$48</div>
                <small class="text-muted">★★★★★</small>
              </div>
              <button class="btn btn-secondary">Add to Cart</button>
            </div>
          </div>

          <div class="card p-4">
            <div
class="image" style="
                height: 180px;
                background-image: url(&quot;https://images.unsplash.com/photo-1545239351-1141bd82e8a6?q=80&w=1200&auto=format&fit=crop&ixlib=rb-4.0.3&s=2c3b4e5f6a7b8c9d&quot;);
                background-size: cover;
                background-position: center;
              "></div>
            <h4 class="mt-4">Lemon Raspberry</h4>
            <p class="mt-2 text-sm text-muted">
              Bright, balanced, and elegant.
            </p>
            <div class="mt-4 flex items-center justify-between">
              <div>
                <div class="font-medium">$52</div>
                <small class="text-muted">★★★★★</small>
              </div>
              <button class="btn btn-secondary">Add to Cart</button>
            </div>
          </div>

          <div class="card p-4">
            <div
class="image" style="
                height: 180px;
                background-image: url(&quot;https://images.unsplash.com/photo-1523986371872-9d3ba2e2f642?q=80&w=1200&auto=format&fit=crop&ixlib=rb-4.0.3&s=7b8c9d0a1b2c3d4e&quot;);
                background-size: cover;
                background-position: center;
              "></div>
            <h4 class="mt-4">Chocolate Signature</h4>
            <p class="mt-2 text-sm text-muted">Rich ganache and moist crumb.</p>
            <div class="mt-4 flex items-center justify-between">
              <div>
                <div class="font-medium">$55</div>
                <small class="text-muted">★★★★★</small>
              </div>
              <button class="btn btn-secondary">Add to Cart</button>
            </div>
          </div>

          <div class="card p-4">
            <div
class="image" style="
                height: 180px;
                background-image: url(&quot;https://images.unsplash.com/photo-1505253216365-6c1f9d3d70c4?q=80&w=1200&auto=format&fit=crop&ixlib=rb-4.0.3&s=9d8c7b6a5e4f3d2c&quot;);
                background-size: cover;
                background-position: center;
              "></div>
            <h4 class="mt-4">Assorted Cookies</h4>
            <p class="mt-2 text-sm text-muted">
              Delicate, buttery, and perfect for gifting.
            </p>
            <div class="mt-4 flex items-center justify-between">
              <div>
                <div class="font-medium">$22</div>
                <small class="text-muted">★★★★★</small>
              </div>
              <button class="btn btn-secondary">Add to Cart</button>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Custom Cake Banner -->
    <section>
      <div class="container">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div>
            <h2>Request a Custom Cake</h2>
            <p class="mt-4 text-muted">
              For weddings, birthdays, and unique celebrations, our bespoke
              service crafts a cake that matches your vision and taste.
            </p>
            <div class="mt-6">
              <button class="btn btn-primary">Request a Custom Cake</button>
            </div>
          </div>
          <div>
            <div
class="card image" style="
                height: 320px;
                background-image: url(&quot;https://images.unsplash.com/photo-1540574163026-643ea20ade25?q=80&w=1400&auto=format&fit=crop&ixlib=rb-4.0.3&s=3b2c1d4e5f6a7b8c&quot;);
                background-size: cover;
                background-position: center;
              "></div>
          </div>
        </div>
      </div>
    </section>

    <!-- About -->
    <section>
      <div class="container grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
        <div>
          <h2>Our Story</h2>
          <p class="mt-4 text-muted">
            LnQ Cake & Cookies began as a small atelier devoted to precise
            technique and refined flavor. We source seasonal ingredients and
            craft each piece by hand for a quietly luxurious experience.
          </p>
        </div>
        <div>
          <div
class="image" style="
              height: 260px;
              background-image: url(&quot;https://images.unsplash.com/photo-1504754524776-8f4f37790ca0?q=80&w=1400&auto=format&fit=crop&ixlib=rb-4.0.3&s=2a1b3c4d5e6f7a8b&quot;);
              background-size: cover;
              background-position: center;
            "></div>
        </div>
      </div>
    </section>

    <!-- Testimonials -->
    <section>
      <div class="container">
        <h2 class="mb-6">Testimonials</h2>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div class="card p-6">
            <p class="text-muted">
              "An exquisite cake — delicate, balanced, and the most beautiful
              finish. Our guests couldn't stop complimenting it."
            </p>
            <div class="mt-4 font-medium">— Charlotte M.</div>
          </div>

          <div class="card p-6">
            <p class="text-muted">
              "The custom design was executed perfectly. Attention to detail and
              flavor were exceptional."
            </p>
            <div class="mt-4 font-medium">— Hugo P.</div>
          </div>

          <div class="card p-6">
            <p class="text-muted">
              "Packaging and presentation made this a beautiful gift. Taste
              matched the elegant look."
            </p>
            <div class="mt-4 font-medium">— Amelia R.</div>
          </div>
        </div>
      </div>
    </section>

    <!-- Instagram Gallery -->
    <section>
      <div class="container">
        <h2 class="mb-6">Instagram</h2>
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div
class="image" style="
              height: 120px;
              background-image: url(&quot;https://images.unsplash.com/photo-1521302080393-2e7b2a2f6f44?q=80&w=800&auto=format&fit=crop&ixlib=rb-4.0.3&s=9a8b7c6d5e4f3b2a&quot;);
            "></div>
          <div
class="image" style="
              height: 120px;
              background-image: url(&quot;https://images.unsplash.com/photo-1527515637466-4c5f2d3d4a1b?q=80&w=800&auto=format&fit=crop&ixlib=rb-4.0.3&s=1a2b3c4d5e6f7a8b&quot;);
            "></div>
          <div
class="image" style="
              height: 120px;
              background-image: url(&quot;https://images.unsplash.com/photo-1512058564366-c9e3f6df3f94?q=80&w=800&auto=format&fit=crop&ixlib=rb-4.0.3&s=6b5c4d3e2f1a0b9c&quot;);
            "></div>
          <div
class="image" style="
              height: 120px;
              background-image: url(&quot;https://images.unsplash.com/photo-1499636136210-6f4ee915583e?q=80&w=800&auto=format&fit=crop&ixlib=rb-4.0.3&s=7c6d5e4f3a2b1c0d&quot;);
            "></div>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.text-muted {
  color: var(--color-muted);
}

.image {
  border-radius: var(--radius-lg);
  width: 100%;
  overflow: hidden;
}

img.image {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
  border-radius: inherit;
}

.card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
}

section {
  padding-block: 4.5rem;
}

h2 {
  font-size: 1.8rem;
}

@media (min-width: 768px) {
  section {
    padding-block: 6rem;
  }
}
</style>
