const fs = require('fs');
const readlineSync = require('readline-sync');
const PDFDocument = require('pdfkit');

const questions = JSON.parse(fs.readFileSync('questions.json', 'utf8'));

function generateQuestionPaper(totalMarks, difficultyDistribution) {
    const questionPaper = [];

    const numEasy = Math.round(totalMarks * (difficultyDistribution.easy / 100));
    const numMedium = Math.round(totalMarks * (difficultyDistribution.medium / 100));
    let numHard = totalMarks - numEasy - numMedium;

    const easyQuestions = questions.filter((q) => q.difficulty === 'Easy');
    const mediumQuestions = questions.filter((q) => q.difficulty === 'Medium');
    const hardQuestions = questions.filter((q) => q.difficulty === 'Hard');

    easyQuestions.sort((a, b) => a.marks - b.marks);
    mediumQuestions.sort((a, b) => a.marks - b.marks);
    hardQuestions.sort((a, b) => a.marks - b.marks);

    shuffleArray(easyQuestions);
    shuffleArray(mediumQuestions);
    shuffleArray(hardQuestions);

    const selectedQuestions = [
        ...easyQuestions.slice(0, numEasy),
        ...mediumQuestions.slice(0, numMedium),
        ...hardQuestions.slice(0, numHard),
    ];

    shuffleArray(selectedQuestions);

    while (selectedQuestions.length > 0 && getTotalMarks(questionPaper) < totalMarks) {
        const currentQuestion = selectedQuestions.shift();

        if (getTotalMarks([...questionPaper, currentQuestion]) <= totalMarks) {
            questionPaper.push(currentQuestion);
        } else {
            break;
        }
    }

    return questionPaper;
}

function getTotalMarks(questionPaper) {
    return questionPaper.reduce((total, q) => total + q.marks, 0);
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

function createQuestionPaperPDF(questionPaper, totalMarks) {
    const pdfStream = fs.createWriteStream('QuestionPaper.pdf');
    const pdfDoc = new PDFDocument();

    pdfDoc.pipe(pdfStream);

    pdfDoc.fontSize(18).text('Generated Question Paper', { align: 'center' });
    pdfDoc.moveDown();

    pdfDoc.fontSize(12).text('Question  Topic  Difficulty  Marks', { align: 'left' })
    .text(' ', { align: 'left' });
    pdfDoc.moveDown();

    questionPaper.forEach((q, index) => {
        pdfDoc.text(`${index + 1}. ${q.question}  ${q.topic}  ${q.difficulty}  ${q.marks}`);
        pdfDoc.moveDown();
    });

    pdfDoc.moveDown().text(`Total Marks: ${totalMarks}`, { align: 'left' });

    pdfDoc.end();
    console.log('PDF generated successfully.');
}

const totalMarks = parseInt(readlineSync.question('Enter the total marks for the question paper: '));

let easyPercentage = parseFloat(readlineSync.question('Enter the percentage of Easy questions: '));
let mediumPercentage = parseFloat(readlineSync.question('Enter the percentage of Medium questions:'));

const hardPercentage = 100 - easyPercentage - mediumPercentage;

const totalPercentage = easyPercentage + mediumPercentage + hardPercentage;
if (totalPercentage !== 100) {
    console.log('Error: The sum of percentages must be equal to 100.');
    process.exit(1);
}

const difficultyDistribution = {
    easy: easyPercentage,
    medium: mediumPercentage,
    hard: hardPercentage,
};

const questionPaper = generateQuestionPaper(totalMarks, difficultyDistribution);

let difference = totalMarks - getTotalMarks(questionPaper);

if (difference > 0) {
    const additionalEasyQuestions = [];

    if (difference % 2 === 1) {
        const oneMarkEasyQuestion = questions.find(q => q.difficulty === 'Easy' && q.marks === 1);
        if (oneMarkEasyQuestion) {
            additionalEasyQuestions.push(oneMarkEasyQuestion);
            difference -= 1;
        }
    }

    const twoMarksEasyQuestions = questions.filter(q => q.difficulty === 'Easy' && q.marks === 2);
    additionalEasyQuestions.push(...twoMarksEasyQuestions.slice(0, difference / 2));

    additionalEasyQuestions.sort((a, b) => a.marks - b.marks);

    questionPaper.push(...additionalEasyQuestions);
}

console.log('\nGenerated Question Paper:');
console.log('-------------------------');
console.log('Question Topic Difficulty Marks');
console.log('-------------------------');
questionPaper.forEach((q, index) => {
    console.log(`${index + 1}. ${q.question} ${q.topic}  ${q.difficulty}  ${q.marks}`);
});
console.log('-------------------------');
console.log(`Total Marks: ${getTotalMarks(questionPaper)}`);

createQuestionPaperPDF(questionPaper, totalMarks);
