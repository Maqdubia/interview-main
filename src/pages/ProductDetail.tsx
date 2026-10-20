import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { CartDrawer } from "@/components/CartDrawer";
import { useCartStore } from "@/stores/cartStore";
import {
  PRODUCT_BY_HANDLE_QUERY,
  ShopifyProduct,
  storefrontApiRequest,
  formatPrice,
} from "@/lib/shopify";
import { Loader2, ChevronLeft, ShoppingBag, PackageOpen } from "lucide-react";
import { tap } from "@/lib/haptics";

interface SelectedVariant {
  id: string;
  title: string;
  price: { amount: string; currencyCode: string };
  availableForSale: boolean;
  selectedOptions: Array<{ name: string; value: string }>;
}

const ProductDetail = () => {
  const { handle } = useParams<{ handle: string }>();
  const addItem = useCartStore((state) => state.addItem);
  const isLoading = useCartStore((state) => state.isLoading);

  const [product, setProduct] = useState<ShopifyProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Record<string, string>>({});

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        const data = await storefrontApiRequest(PRODUCT_BY_HANDLE_QUERY, { handle });
        if (cancelled) return;
        const node = data?.data?.product ?? null;
        setProduct(node ? { node } : null);
        setError(null);
      } catch (err) {
        if (!cancelled) {
          console.error("Failed to load product:", err);
          setError("Could not load this product right now.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [handle]);

  const options = product?.node.options ?? [];
  const variants = useMemo<SelectedVariant[]>(
    () => product?.node.variants.edges.map((e) => e.node) ?? [],
    [product]
  );

  // Initialize selection from the first available variant
  useEffect(() => {
    if (variants.length > 0) {
      setSelected(Object.fromEntries(variants[0].selectedOptions.map((o) => [o.name, o.value])));
    }
  }, [variants]);

  const selectedVariant = useMemo(() => {
    if (variants.length === 0) return undefined;
    return (
      variants.find((v) => v.selectedOptions.every((o) => selected[o.name] === o.value)) || variants[0]
    );
  }, [variants, selected]);

  const node = product?.node;
  const image = node?.images.edges[0]?.node;

  const handleAddToCart = async () => {
    tap();
    if (!node || !selectedVariant) return;
    await addItem({
      product,
      variantId: selectedVariant.id,
      variantTitle: selectedVariant.title,
      price: selectedVariant.price,
      quantity: 1,
      selectedOptions: selectedVariant.selectedOptions || [],
    });
  };

  return (
    <div className="min-h-dvh bg-background">
      <div className="container mx-auto px-4 py-6 md:py-10">
        <div className="flex items-center justify-between mb-6">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/shop">
              <ChevronLeft className="h-4 w-4 mr-1" /> Back to shop
            </Link>
          </Button>
          <CartDrawer />
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : error || !node ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-accent text-accent-foreground">
              <PackageOpen className="h-8 w-8" />
            </div>
            <h1 className="font-display text-xl font-bold">Product not found</h1>
            <p className="text-muted-foreground text-sm">{error || "This product doesn't exist in the store."}</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-start">
            {/* Image */}
            <div className="rounded-2xl border border-border/60 bg-secondary/40 aspect-square overflow-hidden shadow-soft">
              {image ? (
                <img src={image.url} alt={image.altText || node.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                  <ShoppingBag className="h-12 w-12" />
                </div>
              )}
            </div>

            {/* Details */}
            <div className="flex flex-col gap-4">
              <h1 className="font-display text-2xl md:text-3xl font-extrabold tracking-tight">{node.title}</h1>
              <p className="font-display text-2xl font-bold text-primary">
                {formatPrice(node.priceRange.minVariantPrice.amount, node.priceRange.minVariantPrice.currencyCode)}
              </p>
              {node.description && (
                <p className="text-muted-foreground whitespace-pre-line text-sm md:text-base">{node.description}</p>
              )}

              {/* Variant options */}
              {options.map((option) => (
                <div key={option.name} className="flex flex-col gap-1.5">
                  <span className="text-sm font-medium">{option.name}</span>
                  <div className="flex flex-wrap gap-2">
                    {option.values.map((value) => {
                      const isActive = selected[option.name] === value;
                      return (
                        <button
                          key={value}
                          onClick={() => {
                            tap();
                            setSelected((prev) => ({ ...prev, [option.name]: value }));
                          }}
                          className={`rounded-xl border px-4 py-2 text-sm transition-smooth active:scale-95 ${
                            isActive
                              ? "border-primary bg-primary text-primary-foreground"
                              : "border-border bg-card hover:bg-accent"
                          }`}
                        >
                          {value}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}

              <Button
                size="lg"
                className="mt-2"
                onClick={handleAddToCart}
                disabled={isLoading || !selectedVariant?.availableForSale}
              >
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <ShoppingBag className="h-4 w-4 mr-2" />}
                {selectedVariant?.availableForSale === false ? "Sold out" : "Add to Cart"}
              </Button>
              <p className="text-xs text-muted-foreground">
                Checkout is completed securely on Shopify in a new tab.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductDetail;
