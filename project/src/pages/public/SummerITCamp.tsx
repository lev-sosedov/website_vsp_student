import ProgramDetailsLayout from '../../components/public/ProgramDetailsLayout';
import { summerITCampData } from '../../data/public/summerITCampData';

export default function SummerITCamp() {
  return (
    <ProgramDetailsLayout program={summerITCampData} />
  );
}