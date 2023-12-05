import React, { useState } from 'react';
import * as XLSX from 'xlsx';

function ExcelReader() {
  const [excelData, setExcelData] = useState(null);

  const handleFileUpload = (event: any) => {
    const file = event.target.files[0];
    if (file) {
      readExcel(file);
    }
  };

  const readExcel = (file: any) => {
    const reader = new FileReader();

    reader.onload = (e: any) => {
      const data = e.target.result;
      const workbook = XLSX.read(data, { type: 'binary' });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(sheet);

      // Do something with the jsonData (e.g., calculate sum)
      calculateSum(jsonData);
    };

    reader.readAsBinaryString(file);
  };

  const calculateSum = (data: any) => {

    // Assuming your Excel file has a column named 'price'
    // const sum = data.reduce((acc: any, row: any) => acc + parseFloat(row.price || 0), 0);

    console.log('Sum of prices:', data);
    setExcelData(data); // Save data if needed in the state
  };

  return (
    <div>
      <input type="file" onChange={handleFileUpload} />
      {excelData && <p>Data loaded successfully!</p>}
    </div>
  );
}

export default ExcelReader;