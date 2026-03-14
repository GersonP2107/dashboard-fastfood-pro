$root = Split-Path -Parent $PSScriptRoot

$files = @(
    "$root\app\login\page.tsx",
    "$root\app\register\page.tsx",
    "$root\app\forgot-password\page.tsx",
    "$root\app\reset-password\page.tsx",
    "$root\app\verify-email\page.tsx",
    "$root\app\auth\error\page.tsx",
    "$root\app\(dashboard)\orders\page.tsx",
    "$root\app\(dashboard)\history\page.tsx",
    "$root\components\orders\OrderKanbanCard.tsx",
    "$root\components\ui\ConfirmDialog.tsx",
    "$root\components\dashboard\TrialBanner.tsx",
    "$root\components\dashboard\StatCard.tsx",
    "$root\components\dashboard\SetupGuide.tsx",
    "$root\components\orders\OrderDetailModal.tsx",
    "$root\components\settings\MenuQrCard.tsx",
    "$root\components\settings\DeliveryZonesManager.tsx",
    "$root\components\settings\PaymentMethodsManager.tsx",
    "$root\components\settings\BusinessCategorySelector.tsx",
    "$root\components\products\ProductList.tsx",
    "$root\components\products\ProductForm.tsx",
    "$root\components\products\ProductModifiersManager.tsx",
    "$root\components\categories\CategoryList.tsx",
    "$root\components\inventory\InventoryTable.tsx",
    "$root\components\billing\SubscriptionStatusBanner.tsx",
    "$root\components\layout\QuickActionsPanel.tsx"
)

$replacements = @(
    @{ From = 'bg-orange-600'; To = 'bg-brand-primary' },
    @{ From = 'bg-orange-500'; To = 'bg-brand-primary/90' },
    @{ From = 'bg-orange-700'; To = 'bg-brand-accent' },
    @{ From = 'hover:bg-orange-500'; To = 'hover:bg-brand-primary-hover' },
    @{ From = 'hover:bg-orange-700'; To = 'hover:bg-brand-accent' },
    @{ From = 'hover:bg-orange-600'; To = 'hover:bg-brand-primary' },
    @{ From = 'text-orange-600'; To = 'text-brand-primary' },
    @{ From = 'text-orange-500'; To = 'text-brand-primary' },
    @{ From = 'text-orange-400'; To = 'text-brand-light' },
    @{ From = 'hover:text-orange-500'; To = 'hover:text-brand-primary-hover' },
    @{ From = 'focus:ring-orange-600'; To = 'focus:ring-brand-primary' },
    @{ From = 'focus-visible:outline-orange-600'; To = 'focus-visible:outline-brand-primary' },
    @{ From = 'shadow-orange-600/20'; To = 'shadow-brand-primary/20' },
    @{ From = 'shadow-orange-600'; To = 'shadow-brand-primary' },
    @{ From = 'ring-orange-600'; To = 'ring-brand-primary' },
    @{ From = 'border-orange-600'; To = 'border-brand-primary' },
    @{ From = 'border-orange-500/30'; To = 'border-brand-primary/30' },
    @{ From = 'border-orange-300'; To = 'border-brand-primary/40' },
    @{ From = 'border-orange-200'; To = 'border-brand-primary/20' },
    @{ From = 'border-orange-100'; To = 'border-brand-primary/15' },
    @{ From = 'border-orange-800'; To = 'border-brand-primary/40' },
    @{ From = 'from-orange-600'; To = 'from-brand-primary' },
    @{ From = 'from-orange-500'; To = 'from-brand-primary' },
    @{ From = 'from-orange-400'; To = 'from-brand-light' },
    @{ From = 'to-red-600'; To = 'to-brand-accent' },
    @{ From = 'to-red-500'; To = 'to-brand-accent' },
    @{ From = 'to-orange-600'; To = 'to-brand-primary' },
    @{ From = 'to-orange-400'; To = 'to-brand-primary' },
    @{ From = 'bg-orange-50'; To = 'bg-brand-primary/8' },
    @{ From = 'bg-orange-100'; To = 'bg-brand-primary/12' },
    @{ From = 'bg-orange-600/20'; To = 'bg-brand-primary/20' },
    @{ From = 'bg-orange-600/10'; To = 'bg-brand-primary/10' },
    @{ From = 'bg-orange-500/20'; To = 'bg-brand-primary/20' },
    @{ From = 'ring-orange-100'; To = 'ring-brand-primary/15' },
    @{ From = 'ring-orange-900/30'; To = 'ring-brand-primary/30' },
    @{ From = 'ring-orange-200'; To = 'ring-brand-primary/20' },
    @{ From = 'ring-orange-800'; To = 'ring-brand-primary/40' },
    @{ From = 'bg-orange-900/20'; To = 'bg-brand-primary/15' },
    @{ From = 'bg-orange-900/10'; To = 'bg-brand-primary/10' },
    @{ From = 'bg-orange-900/30'; To = 'bg-brand-primary/25' },
    @{ From = 'bg-orange-900/40'; To = 'bg-brand-primary/30' },
    @{ From = 'text-orange-800'; To = 'text-brand-accent' },
    @{ From = 'text-orange-700'; To = 'text-brand-primary' },
    @{ From = 'text-orange-300'; To = 'text-brand-light' },
    @{ From = 'dark:text-orange-400'; To = 'dark:text-brand-light' },
    @{ From = 'dark:text-orange-300'; To = 'dark:text-brand-light' },
    @{ From = 'dark:border-orange-800'; To = 'dark:border-brand-primary/40' },
    @{ From = 'dark:border-orange-900/30'; To = 'dark:border-brand-primary/25' },
    @{ From = 'dark:border-orange-900/50'; To = 'dark:border-brand-primary/35' }
)

foreach ($file in $files) {
    if (Test-Path $file) {
        $content = Get-Content $file -Raw -Encoding UTF8
        $changed = $false
        foreach ($r in $replacements) {
            if ($content -match [regex]::Escape($r.From)) {
                $content = $content.Replace($r.From, $r.To)
                $changed = $true
            }
        }
        if ($changed) {
            Set-Content $file $content -NoNewline -Encoding UTF8
            Write-Host "Updated: $(Split-Path $file -Leaf)"
        } else {
            Write-Host "No changes: $(Split-Path $file -Leaf)"
        }
    } else {
        Write-Host "Not found: $file"
    }
}
Write-Host "Done!"
