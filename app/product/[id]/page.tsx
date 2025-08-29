import Image from "next/image"
import Link from "next/link"
import { notFound } from "next/navigation"
import { createServerSupabaseClient } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ProductCharacteristics } from "@/components/product-characteristics"
import { ChevronLeft, ArrowRight, Truck, Info } from "lucide-react"
import { AddToCartButton } from "@/components/add-to-cart-button"
import  PriceCalculator  from "@/components/calculator/price-calculator"

interface ProductPageProps {
  params: {
    id: string
  }
}

async function getProduct(id: string) {
  const supabase = createServerSupabaseClient()

  const { data: product, error } = await supabase
    .from("products")
    .select(
      `
      *,
      category:categories(id, name, parent_id)
    `,
    )
    .eq("id", id)
    .single()

  if (error || !product) {
    return null
  }

  // Получаем родительские категории для хлебных крошек
  if (product.category && product.category.parent_id) {
    const { data: parentCategory } = await supabase
      .from("categories")
      .select("id, name, parent_id")
      .eq("id", product.category.parent_id)
      .single()

    if (parentCategory) {
      product.category.parent = parentCategory

      // Если есть еще один уровень родительской категории
      if (parentCategory.parent_id) {
        const { data: grandParentCategory } = await supabase
          .from("categories")
          .select("id, name")
          .eq("id", parentCategory.parent_id)
          .single()

        if (grandParentCategory) {
          product.category.parent.parent = grandParentCategory
        }
      }
    }
  }

  // Получаем похожие товары из той же категории
  const { data: relatedProducts } = await supabase
    .from("products")
    .select("id, name, price, image_url, unit")
    .eq("category_id", product.category_id)
    .neq("id", product.id)
    .limit(4)

  return { product, relatedProducts: relatedProducts || [] }
}

export default async function ProductPage({ params }: ProductPageProps) {
  const data = await getProduct(params.id)

  if (!data) {
    notFound()
  }

  const { product, relatedProducts } = data

  // Строим хлебные крошки
  const breadcrumbs = []
  let currentCategory = product.category

  while (currentCategory) {
    breadcrumbs.unshift({
      id: currentCategory.id,
      name: currentCategory.name,
    })
    currentCategory = currentCategory.parent
  }

  // Преобразуем Product в CartProduct для кнопки добавления в корзину
  const cartProduct = {
    id: product.id,
    name: product.name,
    price: product.price,
    image_url: product.image_url,
    unit: product.unit,
    category_id: product.category_id,
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Хлебные крошки */}
      <nav className="flex items-center text-sm text-gray-500 mb-4">
        <Link href="/catalog" className="hover:text-green-600">
          Каталог
        </Link>
        {breadcrumbs.map((crumb, index) => (
          <span key={crumb.id} className="flex items-center">
            <span className="mx-2">/</span>
            {index === breadcrumbs.length - 1 ? (
              <span className="text-gray-700">{crumb.name}</span>
            ) : (
              <Link
                href={`/catalog?category=${crumb.id}`}
                className="hover:text-green-600"
              >
                {crumb.name}
              </Link>
            )}
          </span>
        ))}
      </nav>

      {/* Кнопка возврата в категорию - компактная, слева */}
      <div className="mb-6">
        <Button 
          variant="outline" 
          size="sm"
          asChild 
          className="inline-flex items-center bg-white hover:bg-green-50 text-green-700 hover:text-green-800 border-green-200 hover:border-green-300 shadow-sm transition-all"
        >
          <Link href={`/catalog?category=${product.category_id}`}>
            <ChevronLeft className="h-4 w-4 mr-1" />
            Назад в категорию
          </Link>
        </Button>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 mb-12">
        {/* Изображение товара */}
        <div className="lg:w-1/2">
          <div className="relative aspect-square rounded-lg overflow-hidden border shadow-sm">
            <Image
              src={product.image_url || "/placeholder.svg?height=600&width=600"}
              alt={product.name}
              fill
              className="object-cover"
              priority
            />
          </div>
        </div>

        {/* Информация о товаре */}
        <div className="lg:w-1/2">
          <h1 className="text-3xl font-bold mb-2">{product.name}</h1>

          <div className="flex items-center gap-3 mb-4">
            <Badge variant="outline" className="bg-green-50 text-green-800 border-green-200">
              {product.category?.name || "Без категории"}
            </Badge>

            <Badge
              variant={product.stock > 0 ? "outline" : "destructive"}
              className={product.stock > 0 ? "bg-green-50 text-green-800 border-green-200" : ""}
            >
              {product.stock > 0 ? "В наличии" : "На заказ"}
            </Badge>
          </div>

          <div className="flex items-end gap-2 mb-6">
            <span className="text-3xl font-bold">{product.price} ₽</span>
            <span className="text-gray-500">за {product.unit}</span>
          </div>

          {product.description && (
            <div className="mb-6">
              <h2 className="font-medium text-lg mb-2">Описание</h2>
              <p className="text-gray-700">{product.description}</p>
            </div>
          )}

          <div className="flex gap-4 mb-8">
            <AddToCartButton product={cartProduct} className="w-auto" showQuantity />
          </div>

          {/* <div className="mb-8">
            <h2 className="font-medium text-lg mb-2">Рассчитать стоимость</h2>
            <PriceCalculator product={cartProduct} />
          </div> */}

          {/* Характеристики товара */}
          {product.characteristics && Object.keys(product.characteristics).length > 0 && (
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <ProductCharacteristics characteristics={product.characteristics} />
            </div>
          )}

          <div className="border-t pt-4">
            <h3 className="font-medium flex items-center gap-2 mb-3">
              <Truck className="h-4 w-4 text-green-600" />
              Доставка и оплата
            </h3>
            <ul className="space-y-2 text-sm text-gray-600 mb-3">
              <li className="flex items-start gap-2">
                <span className="text-green-600 font-bold">•</span>
                <span>Доставка по Москве и области</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 font-bold">•</span>
                <span>Разгрузка манипулятором</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 font-bold">•</span>
                <span>Оплата наличными или картой при получении</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 font-bold">•</span>
                <span>Безналичный расчет для юридических лиц</span>
              </li>
            </ul>
            <Link href="/delivery" className="inline-flex items-center text-sm text-green-600 hover:text-green-800 hover:underline">
              <Info className="h-4 w-4 mr-1" />
              Ознакомиться с условиями доставки подробнее
            </Link>
          </div>
        </div>
      </div>

      {/* Похожие товары */}
      {relatedProducts.length > 0 && (
        <div className="mt-12">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Похожие товары</h2>
            <Button variant="link" asChild className="text-green-600 hover:text-green-700">
              <Link href={`/catalog?category=${product.category_id}`}>
                Все товары в категории <ArrowRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {relatedProducts.map((relatedProduct) => (
              <Link
                key={relatedProduct.id}
                href={`/product/${relatedProduct.id}`}
                className="bg-white rounded-lg border shadow-sm overflow-hidden hover:shadow-md transition-shadow"
              >
                <div className="aspect-square relative">
                  <Image
                    src={relatedProduct.image_url || "/placeholder.svg?height=300&width=300"}
                    alt={relatedProduct.name}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="p-4">
                  <h3 className="font-medium line-clamp-2">{relatedProduct.name}</h3>
                  <p className="font-bold mt-2">{relatedProduct.price} ₽</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
