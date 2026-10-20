import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { CartDrawer } from "@/components/CartDrawer";
import { useCartStore, CartItem } from "@/stores/cartStore";
import { STOREFRONT_QUERY, ShopifyProduct, ShopInfo, storefrontApiRequest, formatPrice } from "@/lib/shopify";
import { ShoppingBag, Loader2, PackageOpen } from "lucide-react";
import { tap } from "@/lib/haptics";

interface ProductsResult {
  products: ShopifyProduct[];
  shop: ShopInfo | null;
  error: string | null;
}

const useProducts = (first = 12, query?: string): ProductsResult => {
  const [result, setResult] = useState<ProductsResult>({ products: [], shop: null, error: null });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await storefrontApiRequest(STOREFRONT_QUERY, { first, query: query ?? null });
        if (cancelled) return;
        setResult({
          products: (data?.data?.products?.edges ?? []) as ShopifyProduct[],
          shop: data?.data?.shop ?? null,
          error: null,
        });
      } catch (err) {
        if (!cancelled) {
          console.error("Failed to load products:", err);
          setResult({ products: [], shop: null, error: "Could not load products right now." });
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [first, query]);

  return result;
};

export const ProductCard = ({ product }: { product: ShopifyProduct }) => {
  const addItem = useCartStore((state) => state.addItem);
  const isLoading = useCartStore((state) => state.isLoading);
  const node = product.node;
  const variant = node.variants.edges[0]?.node;
  const image = node.images.edges[0]?.node;
  const currency = node.priceRange.minVariantPrice.currencyCode;

  const handleAddToCart = async () => {
    tap();
    if (!variant) return;
    await addItem({
      product,
      variantId: variant.id, // Full GraphQL ID
      variantTitle: variant.title,
      price: variant.price,
      quantity: 1,
      selectedOptions: variant.selectedOptions || [],
    });
  };

  return (
    <div className="group flex flex-col rounded-2xl border border-border/60 bg-card shadow-soft overflow-hidden transition-smooth hover:-translate-y-1 hover:shadow-card">
      <Link to={`/product/${node.handle}`} className="block bg-secondary/40 aspect-square overflow-hidden">
        {image ? (
          <img
            src={image.url}
            alt={image.altText || node.title}
            className="w-full h-full object-cover transition-smooth group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
            <ShoppingBag className="h-10 w-10" />
          </div>
        )}
      </Link>
      <div className="flex flex-col flex-1 p-4 gap-2">
        <Link to={`/product/${node.handle}`} className="font-medium leading-snug line-clamp-2 hover:text-primary">
          {node.title}
        </Link>
        <p className="text-sm text-muted-foreground line-clamp-2 flex-1">{node.description}</p>
        <div className="flex items-center justify-between gap-2 pt-1">
          <span className="font-display font-bold text-primary">
            {formatPrice(node.priceRange.minVariantPrice.amount, currency)}
          </span>
          <Button size="sm" onClick={handleAddToCart} disabled={isLoading || !variant?.availableForSale}>
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Add to Cart"}
          </Button>
        </div>
      </div>
    </div>
  );
};

const Shop = () => {
  const { products, shop, error } = useProducts();
  const itemsInCart = useCartStore((state) => state.items.reduce((sum, i) => sum + i.quantity, 0));

  return (
    <div className="min-h-dvh bg-background">
      {/* Store hero */}
      <section className="bg-gradient-hero text-primary-foreground">
        <div className="container mx-auto px-4 py-12 md:py-16 flex flex-col items-center text-center gap-3">
          <span className="inline-flex items-center gap-2 text-sm font-medium opacity-90">
            <ShoppingBag className="h-4 w-4" /> Official Store
          </span>
          <h1 className="font-display text-3xl md:text-5xl font-extrabold tracking-tight">
            {shop?.name || "Shop"}
          </h1>
          {shop?.description && (
            <p className="max-w-xl text-sm md:text-base opacity-90">{shop.description}</p>
          )}
          {itemsInCart > 0 && (
            <p className="text-sm opacity-80">
              {itemsInCart} item{itemsInCart !== 1 ? "s" : ""} in your cart
            </p>
          )}
        </div>
      </section>

      {/* Products */}
      <section className="container mx-auto px-4 py-10">
        {error ? (
          <p className="text-center text-muted-foreground py-16">{error}</p>
        ) : products.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-accent text-accent-foreground">
              <PackageOpen className="h-8 w-8" />
            </div>
            <h2 className="font-display text-xl font-bold">No products found</h2>
            <p className="text-muted-foreground max-w-sm text-sm">
              This store doesn't have any products yet. Once products are added to the Shopify store, they'll appear
              here automatically.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {products.map((product) => (
              <ProductCard key={product.node.id} product={product} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default Shop;
