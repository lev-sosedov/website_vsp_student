import ProgramDetailsLayout from '../../components/public/ProgramDetailsLayout';
import { systemAdministrationData } from '../../data/public/systemAdministrationData';

export default function SystemAdministration() {
  return (
    <ProgramDetailsLayout program={systemAdministrationData} />
  );
}