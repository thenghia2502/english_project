import { Sign } from "crypto";
import Test from "./test";
import TestImportFile from "./testImportFile";
import Page from "./user-dashboard/page";

export default function Home() {
  return (
    // <LessonManagementPage />
    // <BookList />
    // <WordSearch config={{
    //   image: "/exercises/Screenshot 2025-10-20 150528.png",
    //   grid: { cellSize: 10 },
    //   answers: [
    //     {
    //       pill: { x: 420, y: 30, width: 330, height: 40, radius: 25 },
    //       text: { x: 170, y: 210, value: "three", size: 36 },
    //     },
    //   ],
    // }}
    // />
    // <SpeechToText />
    // <Test/>
    // <div className="min-h-screen flex items-center justify-center">
    //   <SignUpPage />
    // </div>
    // <TestImportFile />
    <Page />
  );
}

