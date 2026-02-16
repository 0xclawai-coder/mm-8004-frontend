import { formatUnits } from "viem"
import Big, { RoundingMode } from "big.js"

/**
 * formatAmountSmart - 스마트 금액 포맷팅 함수
 *
 * 값의 크기에 따라 자동으로 최적의 표현 방식을 선택하고,
 * 필요시 다른 표현 방식도 선택할 수 있도록 모든 옵션을 제공합니다.
 *
 * @param value - 포맷할 값 (bigint 또는 string)
 * @param options - 포맷 옵션
 * @param options.decimals - 토큰 decimals (default: 18)
 * @param options.precision - 소수점 자리수 (default: 4)
 * @param options.rounding - 반올림 방식 'down' | 'halfUp' | 'up' (default: 'down')
 * @param options.locale - 로케일 (default: 'en-US')
 * @param options.useGrouping - 천 단위 구분자(쉼표) 사용 여부 (default: true)
 * @param options.prefix - 앞에 붙일 문자열 (default: '')
 * @param options.suffix - 뒤에 붙일 문자열 (default: '')
 * @param options.signDisplay - 부호 표시 방식 'auto' | 'always' | 'never' (default: 'auto')
 * @param options.compactThreshold - compact 모드 적용 기준값 (default: 1,000,000)
 *
 * @returns {FormatAmountResult} 포맷 결과
 * @returns {string} result.value - 자동 선택된 최적의 포맷 문자열
 * @returns {string} result.mode - 자동 선택된 모드 ('tiny' | 'text' | 'compact')
 * @returns {string} result.tiny - tiny 모드 포맷 (0.0₁₇1 형식)
 * @returns {string} result.text - text 모드 포맷 (일반 숫자 형식)
 * @returns {string} result.compact - compact 모드 포맷 (1.23M 형식)
 * @returns {number|null} result.numeric - Number로 변환 가능한 값 (불가능하면 null)
 * @returns {object} result.meta - 원본 메타데이터 (raw, decimals, sign)
 *
 * @example
 * // 기본 사용 - 아주 작은 값
 * formatAmountSmart('0.00001')
 * // → { mode: 'tiny', value: '0.0₄1', tiny: '0.0₄1', text: '<0.0001', compact: '<0.0001' }
 *
 * @example
 * // precision: 소수점 자리수 조절
 * formatAmountSmart('123.456789', { precision: 2 })
 * // → { mode: 'text', value: '123.45', tiny: '123.45', text: '123.45', compact: '123.46' }
 *
 * formatAmountSmart('123.456789', { precision: 4 })  // default
 * // → { mode: 'text', value: '123.4567', tiny: '123.4567', text: '123.4567', compact: '123.4568' }
 *
 * @example
 * // rounding: 반올림 방식
 * formatAmountSmart('123.456', { precision: 2, rounding: 'down' })  // default
 * // → { value: '123.45', ... }  // 내림
 *
 * formatAmountSmart('123.456', { precision: 2, rounding: 'halfUp' })
 * // → { value: '123.46', ... }  // 반올림
 *
 * formatAmountSmart('123.456', { precision: 2, rounding: 'up' })
 * // → { value: '123.46', ... }  // 올림
 *
 * @example
 * // decimals: 토큰 decimals (bigint 사용 시)
 * formatAmountSmart(1n, { decimals: 18 })  // default 18
 * // → { mode: 'tiny', value: '0.0₁₇1', ... }  // 0.000000000000000001
 *
 * formatAmountSmart(1n, { decimals: 6 })  // USDC 같은 6 decimals 토큰
 * // → { mode: 'tiny', value: '0.0₅1', ... }  // 0.000001
 *
 * @example
 * // prefix, suffix: 앞뒤 문자열
 * formatAmountSmart('123.456', { prefix: '$', suffix: ' USD' })
 * // → { value: '$123.456 USD', tiny: '$123.456 USD', text: '$123.456 USD', ... }
 *
 * formatAmountSmart('10000000', { prefix: '$' })
 * // → { mode: 'compact', value: '$10M', ... }
 *
 * @example
 * // useGrouping: 천 단위 구분자(쉼표)
 * formatAmountSmart('1234567', { useGrouping: true })  // default
 * // → { value: '1.23M', tiny: '1,234,567', text: '1,234,567', ... }
 *
 * formatAmountSmart('1234567', { useGrouping: false })
 * // → { value: '1.23M', tiny: '1234567', text: '1234567', ... }
 *
 * @example
 * // tinyThreshold: tiny 모드 적용 기준 (default: 0.0001)
 * formatAmountSmart('0.00005', { tinyThreshold: 0.0001 })  // default
 * // → { mode: 'tiny', value: '0.0₄5', ... }  // 0.00005 < 0.0001
 *
 * formatAmountSmart('0.00005', { tinyThreshold: 0.00001 })
 * // → { mode: 'text', value: '0', ... }  // 0.00005 >= 0.00001
 *
 * @example
 * // compactThreshold: compact 모드 적용 기준 (default: 1,000,000)
 * formatAmountSmart('10000000', { compactThreshold: 1_000_000 })  // default
 * // → { mode: 'compact', value: '10M', ... }  // 10M >= 1M
 *
 * formatAmountSmart('10000000', { compactThreshold: 100_000_000 })
 * // → { mode: 'text', value: '10,000,000', ... }  // 10M < 100M
 *
 * @example
 * // signDisplay: 부호 표시 방식
 * formatAmountSmart('-123.45', { signDisplay: 'auto' })  // default
 * // → { value: '-123.45', ... }  // 음수만 - 표시
 *
 * formatAmountSmart('123.45', { signDisplay: 'always' })
 * // → { value: '+123.45', ... }  // 항상 부호 표시
 *
 * formatAmountSmart('-123.45', { signDisplay: 'never' })
 * // → { value: '123.45', ... }  // 부호 안 보임
 *
 * 모드 자동 선택 규칙:
 * - tiny: value < tinyThreshold (default: 0.0001)
 * - compact: value >= compactThreshold (default: 1,000,000)
 * - text: 그 외
 *
 * 각 모드 특징:
 * - tiny: precision 무시, 원본 값을 아래첨자로 정확히 표시 (0.0₁₇1)
 * - text: precision 적용, 반올림 후 0이면 "<threshold" 표시
 * - compact: precision 적용, 1M, 10M 같은 압축 표기
 */

// ───────────────────────────────────────────────
// 1️⃣ 타입 정의
// ───────────────────────────────────────────────

export type Rounding = "down" | "halfUp" | "up"

const ROUND: Record<Rounding, RoundingMode> = {
  down: Big.roundDown,
  halfUp: Big.roundHalfUp,
  up: Big.roundUp,
}

export interface FormatAmountResult {
  /** 자동 선택된 값 */
  value: string
  /** 안전하게 표현 가능한 Number (너무 크면 null) */
  numeric: number | null
  /** 원본 메타데이터 */
  meta: {
    raw: bigint | string
    decimals: number
    sign: 1 | -1
  }
  /** 자동으로 선택된 기본 모드 */
  mode: "tiny" | "text" | "compact"
  /** 각 모드별 값 (항상 존재) */
  tiny: string
  tinyPower: number // if 0.0(7)123, return 7 if no decimal, return 0
  text: string
  compact: string
}

export interface FormatAmountOptions {
  decimals?: number
  precision?: number
  rounding?: Rounding
  locale?: string
  useGrouping?: boolean
  prefix?: string
  suffix?: string
  signDisplay?: "auto" | "always" | "never"
  defaultTinyThreshold?: number // tiny로 인식할 기준 (default: 0.0001)
  compactThreshold?: number // compact로 인식할 기준 (default: 1_000)
}

// ───────────────────────────────────────────────
// 2️⃣ 구현
// ───────────────────────────────────────────────

export function formatAmountSmart(
  value: bigint | string,
  {
    decimals = 18,
    precision = 4,
    rounding = "down",
    locale = "en-US",
    useGrouping = true,
    prefix = "",
    suffix = "",
    signDisplay = "auto",
    defaultTinyThreshold,
    compactThreshold = 1_000,
  }: FormatAmountOptions = {},
): FormatAmountResult {
  // Handle undefined, null, or NaN Cases
  if (value === undefined || value === null || Number.isNaN(value)) {
    console.error("Invalid value:", value)
    return {
      value: "N/A",
      numeric: null,
      meta: {
        raw: value,
        decimals,
        sign: 1,
      },
      mode: "text",
      tiny: "N/A",
      tinyPower: 0,
      text: "N/A",
      compact: "N/A",
    }
  }

  const tinyThreshold = defaultTinyThreshold || 1 / 10 ** precision

  const str = typeof value === "string" ? value : formatUnits(value, decimals)
  const big = new Big(str)
  const sign: 1 | -1 = big.lt(0) ? -1 : 1
  const abs = big.abs()

  const makeSigned = (s: string) => {
    if (signDisplay === "always") return sign < 0 ? `-${s}` : `+${s}`
    if (sign < 0) return `-${s}`
    return s
  }

  // Safe numeric
  const safeNum = (() => {
    const n = Number(abs.toString())
    return Number.isFinite(n) && n > 0 ? n : null
  })()

  // 숫자를 아래첨자 유니코드로 변환하는 헬퍼
  const toSubscript = (num: number): string => {
    const subscriptMap: Record<string, string> = {
      "0": "₀", //"₀"
      "1": "₁", //"₁"
      "2": "₂",
      "3": "₃",
      "4": "₄",
      "5": "₅",
      "6": "₆",
      "7": "₇",
      "8": "₈",
      "9": "₉",
    }
    return String(num)
      .split("")
      .map((d) => subscriptMap[d])
      .join("")
  }

  // ─── ① Tiny 포맷 계산 ───
  let tinyValue: string
  let tinyPower: number = 0
  if (abs.lt(tinyThreshold) && abs.gt(0)) {
    const [, frac = ""] = str.split(".")
    const zeroRun = /^0*/.exec(frac)?.[0].length ?? 0
    const tail = frac.slice(zeroRun)
    const significant = tail.slice(0, Math.max(precision, 2)) || "0"
    const subscript = toSubscript(zeroRun)
    const tinyPlain = makeSigned(`0.0${subscript}${significant}`)
    tinyValue = `${prefix}${tinyPlain}${suffix}`
    tinyPower = zeroRun
  } else {
    // tiny 적용 안되면 나중에 textValue로 대체
    tinyValue = "" // 임시
  }

  // ─── ② Text 포맷 계산 (항상) ───
  const rounded = abs.round(precision, ROUND[rounding])
  let textValue: string

  // 반올림 후 0이 되지만 실제로는 0이 아닌 경우
  if (rounded.eq(0) && abs.gt(0)) {
    const threshold = tinyThreshold.toString()
    const textPlain = makeSigned(`<${threshold}`)
    textValue = `${prefix}${textPlain}${suffix}`
  } else {
    const roundedStr = rounded.toFixed(precision)

    const [integer, fraction = ""] = roundedStr.split(".")
    const replacedFraction = fraction ? fraction.replace(/0+$/, "") : ""

    const grouped = useGrouping
      ? new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(Number(integer))
      : integer

    const textPlain = makeSigned(replacedFraction ? `${grouped}.${replacedFraction}` : grouped)
    textValue = `${prefix}${textPlain}${suffix}`
  }

  // ─── ③ Compact 포맷 계산 (항상) ───
  let compactValue: string
  if (safeNum !== null) {
    const formatted = new Intl.NumberFormat(locale, {
      notation: "compact",
      maximumFractionDigits: precision,
      minimumFractionDigits: 0,
    }).format(safeNum)

    // Compact 결과가 "0"이고 실제 값이 0이 아니면 < threshold 표시
    if (formatted === "0" && abs.gt(0)) {
      const threshold = tinyThreshold.toString()
      const compactPlain = makeSigned(`<${threshold}`)
      compactValue = `${prefix}${compactPlain}${suffix}`
    } else {
      const compactPlain = makeSigned(formatted)
      compactValue = `${prefix}${compactPlain}${suffix}`
    }
  } else {
    // safeNum이 null이면 text와 동일하게
    compactValue = textValue
  }

  // ─── Tiny 값이 비어있으면 text로 대체 ───
  if (!tinyValue) {
    tinyValue = textValue
  }

  // ─── 기본 모드 결정 ───
  let mode: "tiny" | "text" | "compact" = "text"
  let autoValue: string = textValue

  if (abs.lt(tinyThreshold) && abs.gt(0) && tinyPower > 1) {
    mode = "tiny"
    autoValue = tinyValue
  } else if (safeNum !== null && safeNum >= compactThreshold) {
    mode = "compact"
    autoValue = compactValue
  }

  return {
    value: autoValue,
    numeric: safeNum,
    meta: { raw: value, decimals, sign },
    mode,
    tiny: tinyValue,
    tinyPower,
    text: textValue,
    compact: compactValue,
  }
}
