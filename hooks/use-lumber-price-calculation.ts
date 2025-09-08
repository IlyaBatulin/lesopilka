"use client"

import { useMemo, useCallback } from "react"
import { Product } from "@/lib/types"
import { PriceUnit } from "@/components/lumber-price-toggle"

/**
 * Стандартные размеры для расчета объема пиломатериалов
 */
interface LumberDimensions {
  /** Толщина в мм */
  thickness: number
  /** Ширина в мм */
  width: number
  /** Длина в мм */
  length: number
}

/**
 * Хук для расчета цены пиломатериалов в зависимости от единицы измерения
 */
export function useLumberPriceCalculation() {
  /**
   * Извлекает размеры из названия товара
   * Ожидает формат: "Фанера ФК 10 мм 1525×1525" или "Доска 25×150×6000"
   */
  const extractDimensionsFromName = useCallback((productName: string): LumberDimensions | null => {
    // Паттерны для разных форматов
    const patterns = [
      // Для фанеры: "Фанера ФК 10 мм 1525×1525"
      /(\d+)\s*мм\s+(\d+)×(\d+)/i,
      // Для досок: "Доска 25×150×6000"
      /(\d+)×(\d+)×(\d+)/i,
      // Для брусков: "Брусок 50×50×3000"
      /(\d+)×(\d+)×(\d+)/i
    ]

    for (const pattern of patterns) {
      const match = productName.match(pattern)
      if (match) {
        if (pattern === patterns[0]) {
          // Фанера: толщина в мм, размеры листа
          return {
            thickness: parseInt(match[1]),
            width: parseInt(match[2]),
            length: parseInt(match[3])
          }
        } else {
          // Пиломатериалы: толщина × ширина × длина
          return {
            thickness: parseInt(match[1]),
            width: parseInt(match[2]),
            length: parseInt(match[3])
          }
        }
      }
    }

    return null
  }, [])

  /**
   * Извлекает размеры из характеристик товара
   */
  const extractDimensionsFromCharacteristics = useCallback((characteristics: Record<string, any>): LumberDimensions | null => {
    const thickness = characteristics?.["Толщина"] || characteristics?.["толщина"]
    const size = characteristics?.["Размер"] || characteristics?.["размер"]

    if (thickness && size) {
      // Извлекаем числовое значение толщины
      const thicknessValue = typeof thickness === "string" 
        ? parseInt(thickness.replace(/\D/g, ""))
        : thickness

      // Извлекаем размеры из строки типа "1525×1525" или "1525x1525"
      const sizeMatch = typeof size === "string" 
        ? size.match(/(\d+)[×x](\d+)/)
        : null

      if (sizeMatch && thicknessValue) {
        return {
          thickness: thicknessValue,
          width: parseInt(sizeMatch[1]),
          length: parseInt(sizeMatch[2])
        }
      }
    }

    return null
  }, [])

  /**
   * Вычисляет объем в кубических метрах на основе размеров
   */
  const calculateVolume = useCallback((dimensions: LumberDimensions): number => {
    // Переводим из мм в метры и вычисляем объем
    const volumeM3 = (dimensions.thickness / 1000) * (dimensions.width / 1000) * (dimensions.length / 1000)
    return volumeM3
  }, [])

  /**
   * Получает цену товара в зависимости от выбранной единицы измерения
   */
  const getPrice = useCallback((product: Product, unit: PriceUnit): { price: number; displayUnit: string } | null => {
    if (unit === "piece") {
      return product.price > 0 
        ? { price: product.price, displayUnit: product.unit || "шт" }
        : null
    }

    if (unit === "cubic") {
      if (!product.price_per_cubic || product.price_per_cubic <= 0) {
        return null
      }
      return { price: product.price_per_cubic, displayUnit: "м³" }
    }

    return null
  }, [])

  /**
   * Конвертирует цену между единицами измерения
   */
  const convertPrice = useCallback((
    product: Product, 
    fromUnit: PriceUnit, 
    toUnit: PriceUnit
  ): number | null => {
    if (fromUnit === toUnit) {
      return fromUnit === "piece" ? product.price : product.price_per_cubic
    }

    // Получаем размеры товара
    const dimensionsFromName = extractDimensionsFromName(product.name)
    const dimensionsFromChar = extractDimensionsFromCharacteristics(product.characteristics || {})
    const dimensions = dimensionsFromName || dimensionsFromChar

    if (!dimensions) {
      return null
    }

    const volume = calculateVolume(dimensions)

    if (fromUnit === "piece" && toUnit === "cubic") {
      // Конвертируем из цены за штуку в цену за куб
      return product.price / volume
    }

    if (fromUnit === "cubic" && toUnit === "piece") {
      // Конвертируем из цены за куб в цену за штуку
      return (product.price_per_cubic || 0) * volume
    }

    return null
  }, [extractDimensionsFromName, extractDimensionsFromCharacteristics, calculateVolume])

  /**
   * Форматирует цену для отображения
   */
  const formatPrice = useCallback((price: number, unit: string): string => {
    return `${price.toLocaleString("ru-RU")} ₽/${unit}`
  }, [])

  return {
    extractDimensionsFromName,
    extractDimensionsFromCharacteristics,
    calculateVolume,
    getPrice,
    convertPrice,
    formatPrice
  }
}
