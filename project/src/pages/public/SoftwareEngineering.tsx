import ProgramDetailsLayout from '../../components/public/ProgramDetailsLayout';
import { softwareEngineeringData } from '../../data/public/softwareEngineeringData';

export default function SoftwareEngineering() {
  return (
    <ProgramDetailsLayout program={softwareEngineeringData} />
  );
}