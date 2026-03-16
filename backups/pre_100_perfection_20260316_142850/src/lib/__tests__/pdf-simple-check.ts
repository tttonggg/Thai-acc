/**
 * Simple check to verify jsPDF and autoTable work correctly
 */

import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

const doc = new jsPDF()

// Check if autoTable is available
console.log('jsPDF instance:', doc)
console.log('autoTable plugin:', autoTable)

// Try to use autoTable
try {
  doc.autoTable({
    head: [['Test', 'Header']],
    body: [['Test', 'Data']],
  })
  console.log('autoTable works!')
} catch (error) {
  console.error('autoTable error:', error)
}
