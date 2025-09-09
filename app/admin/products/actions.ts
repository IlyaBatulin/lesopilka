"use server"

import { revalidatePath } from "next/cache"
import { createServerSupabaseClient } from "@/lib/supabase"

interface ProductInput {
  name: string
  description: string | null
  price: number
  image_url: string | null
  category_id: number
  unit: string
  stock: number
  thickness?: number | null
  characteristics: Record<string, any>
}

interface ProductUpdateInput extends ProductInput {
  id: number
}

export async function addProduct(product: ProductInput) {
  const supabase = createServerSupabaseClient()

  const { error } = await supabase.from("products").insert([product])

  if (error) {
    console.error("Error adding product:", error)
    throw new Error("Failed to add product")
  }

  revalidatePath("/admin/products")
}

export async function updateProduct(product: ProductUpdateInput) {
  const supabase = createServerSupabaseClient()

  const { error } = await supabase
    .from("products")
    .update({
      name: product.name,
      description: product.description,
      price: product.price,
      image_url: product.image_url,
      category_id: product.category_id,
      unit: product.unit,
      stock: product.stock,
      thickness: product.thickness,
      characteristics: product.characteristics,
      updated_at: new Date().toISOString(),
    })
    .eq("id", product.id)

  if (error) {
    console.error("Error updating product:", error)
    throw new Error("Failed to update product")
  }

  revalidatePath("/admin/products")
}

export async function deleteProduct(productId: number) {
  const supabase = createServerSupabaseClient()

  const { error } = await supabase.from("products").delete().eq("id", productId)

  if (error) {
    console.error("Error deleting product:", error)
    throw new Error("Failed to delete product")
  }

  revalidatePath("/admin/products")
}
