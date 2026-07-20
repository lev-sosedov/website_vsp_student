import ProgramDetailsLayout from '../../components/public/ProgramDetailsLayout';
import { threeDPrintingData } from '../../data/public/threeDPrintingData';

export default function ThreeDPrinting() {
  return (
    <ProgramDetailsLayout program={threeDPrintingData} />
  );
}