import React from 'react';
import { useNavigate } from 'react-router-dom';
import ModuleViewLayout from '@/shared/components/module-views/ModuleViewLayout';
import { Card, CardContent } from '@/shared/components/ui/card';
import { BookOpen } from 'lucide-react';
import { journalViews } from '@/modules/journal/views';

const JournalConfigPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <ModuleViewLayout
      title="Configuracion de Diario"
      icon={<BookOpen className="h-4 w-4 text-white" />}
      views={journalViews.map((view) => ({ ...view, component: () => null }))}
      onViewChange={(key) => navigate(`/journal/view/${key}`)}
    >
      <div className="p-4">
        <Card>
          <CardContent className="p-6 text-sm text-gray-600">
            No hay configuraciones especificas para Diario en este modulo.
          </CardContent>
        </Card>
      </div>
    </ModuleViewLayout>
  );
};

export default JournalConfigPage;
