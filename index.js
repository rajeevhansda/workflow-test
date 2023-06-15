const nodemailer = require("nodemailer");
const { Octokit } = require("octokit");
const axios = require("axios");
const XLSX = require("xlsx");
const fs = require("fs");
require("dotenv").config();

const octokit = new Octokit({
  auth: process.env.G_TOKEN,
});
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASSWORD,
  },
});

function sendEmail() {
  // Path to the Excel file you want to attach
  const excelFilePath = "report.xlsx";

  // Create a mail options object
  const mailOptions = {
    from: process.env.GMAIL_USER,
    to: "rajeevrhansda@gmail.com",
    subject: "Issue tracker daily report",
    text: "Please find the attached Excel file.",
    attachments: [
      {
        filename: "report.xlsx",
        path: excelFilePath,
      },
    ],
  };

  // Send the email
  transporter.sendMail(mailOptions, function (error, info) {
    if (error) {
      console.log("Error:", error);
    } else {
      console.log("Email sent:", info.response);
    }
  });
}
async function getOpenIssues() {
  const issues = [];
  let page = 1;
  try {
    while (true) {
      const response = await octokit.request(
        "GET /repos/teslontechnologies/issue-tracker/issues",
        {
          owner: process.env.G_OWNER,
          repo: process.env.G_REPO,
          per_page: 100,
          page: page,
        }
      );
      const currentIssues = response.data;
      if (currentIssues.length === 0) {
        // No more issues to retrieve
        break;
      }
      issues.push(...currentIssues);
      page++;
    }

    return issues;
  } catch (error) {
    console.error("Failed to retrieve open issues", error);
    return null;
  }
}
async function getClosedIssues() {
  const issues = [];
  let page = 1;
  try {
    while (true) {
      const response = await octokit.request(
        "GET /repos/teslontechnologies/issue-tracker/issues",
        {
          owner: process.env.G_OWNER,
          repo: process.env.G_REPO,
          per_page: 100,
          page: page,
          state: "closed",
        }
      );
      const currentIssues = response.data;
      if (currentIssues.length === 0) {
        // No more issues to retrieve
        break;
      }
      issues.push(...currentIssues);
      page++;
    }

    return issues;
  } catch (error) {
    console.error("Failed to retrieve closed issues", error);
    return null;
  }
}
function createExcel(data) {
  const filename = "report.xlsx";

  fs.access(filename, fs.constants.F_OK, (err) => {
    if (err) {
      // File does not exist, create a new workbook
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(data);

      // Add the worksheet to the workbook
      XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");

      // Write the workbook to the file
      XLSX.writeFile(workbook, filename);

      console.log(`New file '${filename}' created.`);

      // Call the upload function
      sendEmail();
    } else {
      // Load the Excel file
      const workbook = XLSX.readFile(filename);

      // Get the first worksheet
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];

      // Find the last row with data
      let lastRow = 0;
      let rowIndex = 1; // Start from 1 to skip the header row

      while (worksheet[`A${rowIndex}`] !== undefined) {
        lastRow = rowIndex;
        rowIndex++;
      }

      // Convert the data array to a 2D array
      const dataArray = data.map((obj) => Object.values(obj));

      // Insert the data at the specified row
      XLSX.utils.sheet_add_aoa(worksheet, dataArray, {
        origin: { r: lastRow, c: 0 },
      });

      // Write the modified workbook back to the file
      XLSX.writeFile(workbook, filename);

      console.log("Data inserted in the Excel file.");
      // Call the upload function
      sendEmail();
    }
  });
}

async function main() {
  const openIssues = await getOpenIssues();
  const closedIssues = await getClosedIssues();
  const fixedOpenIssues = openIssues.filter((obj) =>
    obj.labels.some((label) => label.name === "fixed")
  );
  const fixedClosedIssues = closedIssues.filter((obj) =>
    obj.labels.some((label) => label.name === "fixed")
  );

  const totalFixedIssues = fixedOpenIssues.length + fixedClosedIssues.length;

  const excelData = [
    {
      Date: new Date().toString(),
      TotalOpenIssue: openIssues.length,
      TotalClosedIssue: closedIssues.length,
      TotalFixedCount: totalFixedIssues,
    },
  ];
  createExcel(excelData);
}

main();

console.log('----END----')
