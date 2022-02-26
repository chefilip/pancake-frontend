import { memo } from 'react'
import { Table, Td } from '@pancakeswap/uikit'
import Navigation from 'components/TableNavigation'
import CompactRow from './CompactRow'
import NoOrderTable from './NoOrderTable'
import LoadingTable from './LoadingTable'

const CompactLimitOrderTable = ({ orders }) => {
  if (!orders) return <LoadingTable />

  if (!orders?.length) {
    return <NoOrderTable />
  }

  return (
    <Navigation data={orders}>
      {({ paginatedData }) => (
        <Table>
          <tbody>
            {paginatedData.map((order) => (
              <tr key={order.id}>
                <Td>
                  <CompactRow order={order} />
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </Navigation>
  )
}

export default memo(CompactLimitOrderTable)
