"use client"

import { useMemo } from "react"
import { Product, Category } from "@/lib/types"

// ID основной категории "Пиломатериалы"
// ВАЖНО: замените ID на реальный id категории "Пиломатериалы" из вашей БД
const LUMBER_CATEGORY_ID = 1

/**
 * Хук для определения принадлежности товара к категории пиломатериалов
 */
export function useLumberCategory() {
  /**
   * Проверяет, относится ли товар к категории пиломатериалов
   * @param product - товар для проверки
   * @returns true, если товар относится к пиломатериалам
   */
  const isLumberProduct = useMemo(() => {
    return (product: Product): boolean => {
      // Прямая проверка категории товара
      if (product.category_id === LUMBER_CATEGORY_ID) {
        return true
      }
      
      // Проверка через объект категории, если он есть
      if (product.category) {
        return isLumberCategory(product.category)
      }
      
      return false
    }
  }, [])

  /**
   * Проверяет, является ли категория пиломатериалами или их подкатегорией
   * @param category - категория для проверки
   * @returns true, если категория относится к пиломатериалам
   */
  const isLumberCategory = useMemo(() => {
    return (category: Category): boolean => {
      // Если это основная категория пиломатериалов
      if (category.id === LUMBER_CATEGORY_ID) {
        return true
      }
      
      // Если это подкатегория пиломатериалов
      if (category.parent_id === LUMBER_CATEGORY_ID) {
        return true
      }
      
      // Проверяем уровень глубже (может быть подподкатегория)
      // Для этого нужно рекурсивно проверять родительские категории
      // В рамках текущей задачи ограничимся двумя уровнями
      return false
    }
  }, [])

  /**
   * Проверяет, поддерживает ли товар цену за куб
   * @param product - товар для проверки
   * @returns true, если товар поддерживает цену за куб
   */
  const supportsCubicPricing = useMemo(() => {
    return (product: Product): boolean => {
      return isLumberProduct(product) && product.price_per_cubic != null && product.price_per_cubic > 0
    }
  }, [isLumberProduct])

  return {
    isLumberProduct,
    isLumberCategory,
    supportsCubicPricing,
    LUMBER_CATEGORY_ID
  }
}
