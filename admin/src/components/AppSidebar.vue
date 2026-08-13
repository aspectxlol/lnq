<script setup lang="ts">
import type { DropdownMenuItem, NavigationMenuItem } from "@nuxt/ui";
import { useColorMode } from "@vueuse/core";
import { computed, ref } from "vue";

const open = ref(true);
const colorMode = useColorMode();

const workspace = ref({
  label: "LnQ Cake & Cookies",
  avatar: {
    src: "/logo.png",
    alt: "LnQ",
  },
});

const workspaces = ref([
  {
    label: "LnQ Cake & Cookies",
    avatar: {
      src: "/logo.png",
      alt: "LnQ",
    },
  },
  {
    label: "Development",
    avatar: {
      src: "https://github.com/nuxt.png",
      alt: "Development",
    },
  },
]);

const workspaceItems = computed<DropdownMenuItem[][]>(() => [
  workspaces.value.map((item, index) => ({
    ...item,
    kbds: ["meta", String(index + 1)],
    onSelect() {
      workspace.value = item;
    },
  })),
  [
    {
      label: "Workspace settings",
      icon: "i-lucide-settings-2",
    },
  ],
]);

function getItems(state: "collapsed" | "expanded") {
  return [
    {
      label: "Overview",
      icon: "i-lucide-layout-dashboard",
      to: "/",
    },

    {
      label: "Orders",
      icon: "i-lucide-receipt",
      badge: "12",
      to: "/orders",
    },

    {
      label: "Customers",
      icon: "i-lucide-users",
      to: "/customers",
    },

    {
      label: "Products",
      icon: "i-lucide-package",
      to: "/products",
    },

    {
      label: "Catalog",
      icon: "i-lucide-store",
      children:
        state === "expanded"
          ? [
            {
              label: "Products",
              icon: "i-lucide-box",
              to: "/catalog/products",
            },
            {
              label: "Categories",
              icon: "i-lucide-tags",
              to: "/catalog/categories",
            },
            {
              label: "Pricing",
              icon: "i-lucide-badge-percent",
              to: "/catalog/pricing",
            },
          ]
          : [],
    },

    {
      label: "Operations",
      icon: "i-lucide-command",
      children:
        state === "expanded"
          ? [
            {
              label: "Kitchen",
              icon: "i-lucide-chef-hat",
              to: "/operations/kitchen",
            },
            {
              label: "Printing",
              icon: "i-lucide-printer",
              to: "/operations/printing",
            },
            {
              label: "Delivery",
              icon: "i-lucide-truck",
              to: "/operations/delivery",
            },
          ]
          : [],
    },

    {
      label: "Analytics",
      icon: "i-lucide-chart-no-axes-combined",
      to: "/analytics",
    },

    {
      label: "Settings",
      icon: "i-lucide-settings-2",
      to: "/settings",
    },
  ] satisfies NavigationMenuItem[];
}

const user = ref({
  name: "Louie Hansen Linadi",
  email: "admin@lnqcake.id",
  avatar: {
    src: "https://github.com/benjamincanac.png",
    alt: "Louie Hansen Linadi",
  },
});

const userItems = computed<DropdownMenuItem[][]>(() => [
  [
    {
      label: "Profile",
      icon: "i-lucide-user",
    },
    {
      label: "Account settings",
      icon: "i-lucide-settings-2",
      to: "/settings/account",
    },
  ],
  [
    {
      label: "Appearance",
      icon: "i-lucide-sun-moon",
      children: [
        {
          label: "Light",
          icon: "i-lucide-sun",
          type: "checkbox",
          checked: colorMode.value === "light",
          onUpdateChecked(checked: boolean) {
            if (checked) colorMode.value = "light";
          },
          onSelect(e: Event) {
            e.preventDefault();
          },
        },
        {
          label: "Dark",
          icon: "i-lucide-moon",
          type: "checkbox",
          checked: colorMode.value === "dark",
          onUpdateChecked(checked: boolean) {
            if (checked) colorMode.value = "dark";
          },
          onSelect(e: Event) {
            e.preventDefault();
          },
        },
      ],
    },
  ],
  [
    {
      label: "Documentation",
      icon: "i-lucide-book-open",
      to: "/docs",
    },
    {
      label: "Log out",
      icon: "i-lucide-log-out",
    },
  ],
]);
</script>

<template>
  <div class="flex min-h-screen bg-default">
    <USidebar v-model:open="open" collapsible="icon" rail :ui="{
      container: 'h-full',
      inner: 'bg-elevated/40 border-r border-default',
      header: 'px-2 py-3',
      body: 'px-2 py-3',
      footer: 'px-2 py-3 border-t border-default',
    }">
      <!-- Workspace -->
      <template #header>
        <UDropdownMenu :items="workspaceItems" :content="{
          align: 'start',
          collisionPadding: 12,
        }" :ui="{
          content: 'w-(--reka-dropdown-menu-trigger-width) min-w-64',
        }">
          <UButton v-bind="workspace" trailing-icon="i-lucide-chevrons-up-down" color="neutral" variant="ghost"
            class="w-full overflow-hidden rounded-xl px-2.5 py-2 hover:bg-elevated" :ui="{
              trailingIcon: 'text-dimmed ms-auto',
            }">
            <template #leading>
              <div
                class="size-8 shrink-0 rounded-lg bg-primary/10 ring-1 ring-primary/20 flex items-center justify-center overflow-hidden">
                <UAvatar v-bind="workspace.avatar" size="sm" class="rounded-lg" />
              </div>
            </template>

            <template #default>
              <div class="min-w-0 text-left">
                <div class="font-semibold truncate">
                  {{ workspace.label }}
                </div>
                <div class="text-xs text-dimmed truncate">
                  Admin workspace
                </div>
              </div>
            </template>
          </UButton>
        </UDropdownMenu>
      </template>

      <!-- Navigation -->
      <template #default="{ state }">
        <div class="flex flex-col h-full">
          <UNavigationMenu :key="state" :items="getItems(state)" orientation="vertical" highlight :ui="{
            root: 'space-y-1',
            link: [
              'rounded-lg',
              'transition-all',
              'duration-150',
              'text-muted',
              'hover:text-highlighted',
              'hover:bg-elevated',
              'data-[active=true]:bg-primary/10',
              'data-[active=true]:text-primary',
              'data-[active=true]:font-semibold',
            ],
            linkLeadingIcon: [
              'size-5',
              'transition-transform',
              'group-hover:scale-105',
            ],
            linkTrailing: 'ms-auto',
          }" />

          <!-- Printer status -->
          <div v-if="state === 'expanded'" class="mt-auto pt-4">
            <div class="rounded-xl border border-default bg-default/60 p-3">
              <div class="flex items-center gap-2">
                <div class="relative">
                  <div class="size-2 rounded-full bg-success" />
                  <div class="absolute inset-0 size-2 rounded-full bg-success animate-ping opacity-40" />
                </div>

                <span class="text-xs font-medium">
                  Systems operational
                </span>
              </div>

              <div class="mt-1 text-[11px] text-dimmed">
                Printer & services online
              </div>
            </div>
          </div>
        </div>
      </template>

      <!-- User -->
      <template #footer>
        <UDropdownMenu :items="userItems" :content="{
          align: 'start',
          side: 'right',
          collisionPadding: 12,
        }" :ui="{
          content: 'w-64',
        }">
          <UButton color="neutral" variant="ghost" class="w-full rounded-xl px-2.5 py-2 hover:bg-elevated" :ui="{
            trailingIcon: 'text-dimmed ms-auto',
          }">
            <template #leading>
              <UAvatar v-bind="user.avatar" size="sm" class="ring-1 ring-default" />
            </template>

            <template #default>
              <div class="min-w-0 flex-1 text-left">
                <div class="font-medium truncate">
                  {{ user.name }}
                </div>

                <div class="text-xs text-dimmed truncate">
                  {{ user.email }}
                </div>
              </div>
            </template>

            <template #trailing>
              <UIcon name="i-lucide-chevrons-up-down" class="size-4" />
            </template>
          </UButton>
        </UDropdownMenu>
      </template>
    </USidebar>

    <!-- Main content -->
    <div class="flex min-w-0 flex-1 flex-col">
      <header class="h-(--ui-header-height) shrink-0 flex items-center gap-3 border-b border-default px-4">
        <UButton icon="i-lucide-panel-left" color="neutral" variant="ghost" aria-label="Toggle sidebar"
          @click="open = !open" />

        <div class="h-5 w-px bg-border" />

        <div class="flex items-center gap-2 text-sm">
          <span class="text-dimmed">LnQ</span>
          <UIcon name="i-lucide-chevron-right" class="size-3 text-dimmed" />
          <span class="font-medium">Overview</span>
        </div>
      </header>

      <main class="flex-1 p-6">
        <Placeholder class="size-full" />
      </main>
    </div>
  </div>
</template>