'use client'

import { useState, useCallback } from 'react'
import { useLanguage } from '@/lib/i18n'

export interface DuprFilter {
  gender: 'ALL' | 'MALE' | 'FEMALE'
  type: 'DOUBLES' | 'SINGLES'
  ratingRange: [number, number]
  ageRange: [number, number]
  minRS: number
}

const DEFAULT_FILTER: DuprFilter = {
  gender: 'ALL',
  type: 'DOUBLES',
  ratingRange: [2, 8],
  ageRange: [19, 80],
  minRS: 30,
}

const RATING_MIN = 2
const RATING_MAX = 8
const RATING_STEP = 0.5
const AGE_MIN = 19
const AGE_MAX = 80
const RS_MIN = 30
const RS_MAX = 100
const RS_STEP = 10

interface Props {
  open: boolean
  onClose: () => void
  onConfirm: (filter: DuprFilter) => void
  isFetching: boolean
}

export default function DuprFilterModal({ open, onClose, onConfirm, isFetching }: Props) {
  const { t } = useLanguage()
  const [filter, setFilter] = useState<DuprFilter>(DEFAULT_FILTER)

  if (!open) return null

  const genderOptions: { value: DuprFilter['gender']; label: string }[] = [
    { value: 'ALL', label: t('genderAll') },
    { value: 'MALE', label: t('genderMale') },
    { value: 'FEMALE', label: t('genderFemale') },
  ]

  const ratingLabel = (v: number) => v.toFixed(1)
  const ageLabel = (v: number) => v <= AGE_MIN ? t('ageUnder19') : v >= AGE_MAX ? '80+' : `${v}`

  const typeOptions: { value: DuprFilter['type']; label: string }[] = [
    { value: 'DOUBLES', label: t('duprDoubles') },
    { value: 'SINGLES', label: t('duprSingles') },
  ]

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => !isFetching && onClose()}>
      <div className="bg-white rounded-lg p-6 w-[340px] shadow-xl" onClick={e => e.stopPropagation()}>
        <h3 className="text-lg font-semibold mb-5 text-center">{t('duprFilterTitle')}</h3>

        {/* 1. 性別 Segmented Control */}
        <div className="mb-5">
          <label className="block text-sm font-medium text-gray-700 mb-2">{t('duprGender')}</label>
          <div className="flex rounded-lg border border-gray-300 overflow-hidden">
            {genderOptions.map(opt => (
              <button
                key={opt.value}
                onClick={() => setFilter(f => ({ ...f, gender: opt.value }))}
                className={`flex-1 py-2 text-sm font-medium transition ${
                  filter.gender === opt.value
                    ? 'bg-purple-600 text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* 2. 類型 Segmented Control */}
        <div className="mb-5">
          <label className="block text-sm font-medium text-gray-700 mb-2">{t('duprType')}</label>
          <div className="flex rounded-lg border border-gray-300 overflow-hidden">
            {typeOptions.map(opt => (
              <button
                key={opt.value}
                onClick={() => setFilter(f => ({ ...f, type: opt.value }))}
                className={`flex-1 py-2 text-sm font-medium transition ${
                  filter.type === opt.value
                    ? 'bg-purple-600 text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* 3. DUPR 級別 Range Slider */}
        <div className="mb-5">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('duprRatingRange')}: <span className="text-purple-600 font-semibold">{ratingLabel(filter.ratingRange[0])} ~ {ratingLabel(filter.ratingRange[1])}</span>
          </label>
          <RangeSlider
            min={RATING_MIN}
            max={RATING_MAX}
            step={RATING_STEP}
            value={filter.ratingRange}
            onChange={v => setFilter(f => ({ ...f, ratingRange: v }))}
          />
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>2.0</span><span>4.0</span><span>6.0</span><span>8.0</span>
          </div>
        </div>

        {/* 4. 年齡範圍 Range Slider */}
        <div className="mb-5">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('duprAgeRange')}: <span className="text-purple-600 font-semibold">{ageLabel(filter.ageRange[0])} ~ {ageLabel(filter.ageRange[1])}</span>
          </label>
          <RangeSlider
            min={AGE_MIN}
            max={AGE_MAX}
            step={1}
            value={filter.ageRange}
            onChange={v => setFilter(f => ({ ...f, ageRange: v }))}
          />
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>{t('ageUnder19')}</span><span>30</span><span>50</span><span>70</span><span>80+</span>
          </div>
        </div>

        {/* 5. RS 門檻 Single Slider */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('duprRS')}: <span className="text-purple-600 font-semibold">{filter.minRS}+</span>
          </label>
          <div className="relative h-6">
            <div className="absolute top-1/2 -translate-y-1/2 w-full h-1.5 bg-gray-200 rounded-full" />
            <div
              className="absolute top-1/2 -translate-y-1/2 h-1.5 bg-purple-500 rounded-full"
              style={{ left: '0%', right: `${100 - ((filter.minRS - RS_MIN) / (RS_MAX - RS_MIN)) * 100}%` }}
            />
            <input
              type="range" min={RS_MIN} max={RS_MAX} step={RS_STEP} value={filter.minRS}
              onChange={e => setFilter(f => ({ ...f, minRS: Number(e.target.value) }))}
              className="absolute w-full top-0 h-6 appearance-none bg-transparent [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-purple-600 [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:shadow [&::-webkit-slider-thumb]:cursor-pointer"
            />
          </div>
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>30</span><span>50</span><span>70</span><span>100</span>
          </div>
        </div>

        {/* 按鈕 */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={isFetching}
            className="flex-1 px-4 py-2 border rounded-md text-gray-600 hover:bg-gray-50 disabled:opacity-50"
          >
            {t('duprClose')}
          </button>
          <button
            onClick={() => onConfirm(filter)}
            disabled={isFetching}
            className={`flex-1 px-4 py-2 rounded-md text-white ${
              isFetching
                ? 'bg-gray-300 cursor-not-allowed'
                : 'bg-purple-600 hover:bg-purple-700'
            }`}
          >
            {isFetching ? t('fetchingDupr') : t('duprFilterConfirm')}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ── Dual-thumb Range Slider ── */
function RangeSlider({
  min, max, step, value, onChange,
}: {
  min: number; max: number; step: number
  value: [number, number]
  onChange: (v: [number, number]) => void
}) {
  const pct = (v: number) => ((v - min) / (max - min)) * 100

  const handleMin = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const v = Math.min(Number(e.target.value), value[1] - step)
    onChange([v, value[1]])
  }, [value, step, onChange])

  const handleMax = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const v = Math.max(Number(e.target.value), value[0] + step)
    onChange([value[0], v])
  }, [value, step, onChange])

  return (
    <div className="relative h-6">
      {/* track background */}
      <div className="absolute top-1/2 -translate-y-1/2 w-full h-1.5 bg-gray-200 rounded-full" />
      {/* active range */}
      <div
        className="absolute top-1/2 -translate-y-1/2 h-1.5 bg-purple-500 rounded-full"
        style={{ left: `${pct(value[0])}%`, right: `${100 - pct(value[1])}%` }}
      />
      <input
        type="range" min={min} max={max} step={step} value={value[0]}
        onChange={handleMin}
        className="absolute w-full top-0 h-6 appearance-none bg-transparent pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-purple-600 [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:shadow [&::-webkit-slider-thumb]:cursor-pointer"
      />
      <input
        type="range" min={min} max={max} step={step} value={value[1]}
        onChange={handleMax}
        className="absolute w-full top-0 h-6 appearance-none bg-transparent pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-purple-600 [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:shadow [&::-webkit-slider-thumb]:cursor-pointer"
      />
    </div>
  )
}
