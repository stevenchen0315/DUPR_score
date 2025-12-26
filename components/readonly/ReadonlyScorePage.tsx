'use client'

import { useMemo } from 'react'
import { useScoreData } from '@/hooks/useScoreData'
import { createFilteredRows, handleFilterChange as utilHandleFilterChange } from '@/lib/constants'
import { usePlayerFilter, useScrollToTop } from '@/lib/utils'
import LoadingSpinner from '@/components/shared/LoadingSpinner'
import ScrollToTopButton from '@/components/shared/ScrollToTopButton'
import PlayerFilter from '@/components/shared/PlayerFilter'
import UnifiedScoreTable from '@/components/shared/UnifiedScoreTable'

interface ReadonlyScorePageProps {
  username: string
  defaultMode?: string
}

export default function ReadonlyScorePage({ username, defaultMode = 'dupr' }: ReadonlyScorePageProps) {
  const {
    userList,
    rows,
    isLoading,
    realtimeConnected,
    partnerNumbers
  } = useScoreData(username)

  const { selectedPlayerFilter, setSelectedPlayerFilter, FILTER_STORAGE_KEY } = usePlayerFilter(username, userList)
  const showScrollTop = useScrollToTop()
  
  const isOpenMode = defaultMode === 'open'

  const filteredRows = useMemo(() => createFilteredRows(rows, selectedPlayerFilter), [rows, selectedPlayerFilter])

  const handleFilterChange = (value: string) => {
    utilHandleFilterChange(value, setSelectedPlayerFilter, FILTER_STORAGE_KEY)
  }


  
  if (isLoading) {
    return <LoadingSpinner />
  }

  return (
    <div className="px-2 sm:px-4">
      <UnifiedScoreTable
        filteredRows={filteredRows}
        selectedPlayerFilter={selectedPlayerFilter}
        partnerNumbers={partnerNumbers}
        isOpenMode={isOpenMode}
        readonly={true}
      />

      <div className="flex flex-col items-center mb-6 space-y-4">
        <PlayerFilter
          selectedPlayerFilter={selectedPlayerFilter}
          onFilterChange={handleFilterChange}
          rows={rows}
          partnerNumbers={partnerNumbers}
          filteredRowsLength={filteredRows.length}
        />
      </div>

      <ScrollToTopButton show={showScrollTop} />
    </div>
  )
}