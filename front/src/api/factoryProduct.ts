const FACTORY_PRODUCT_API_BASE_URL =
  import.meta.env.VITE_FACTORY_PRODUCT_API_BASE_URL ?? import.meta.env.VITE_API_BASE_URL ?? ''

type BackendFactoryProductResponse<T> = {
  success?: boolean
  code?: string | number
  message?: string
  data?: T
}

const FACTORY_PRODUCT_SUCCESS_CODES = new Set([0, 200, '0', '200', 'SUCCESS', 'OK'])

export type FactoryProductData = {
  productName: string
  amount: number
  unit: string
}

export async function getFactoryProductApi() {
  const response = await fetch(`${FACTORY_PRODUCT_API_BASE_URL}/api/factory-products`)
  const result = (await response.json().catch(() => ({}))) as BackendFactoryProductResponse<FactoryProductData>

  if (!response.ok && result.code === undefined && result.success === undefined) {
    throw new Error(`HTTP_${response.status}`)
  }

  if (
    result.success === false ||
    (result.code !== undefined && !FACTORY_PRODUCT_SUCCESS_CODES.has(result.code))
  ) {
    throw new Error(result.message || '出厂产品接口调用失败')
  }

  return (result.data ?? result) as FactoryProductData
}
