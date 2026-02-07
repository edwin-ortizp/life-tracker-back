import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/shared/components/ui/card';

interface Props {
  data: unknown;
}

export const DebugDataCard: React.FC<Props> = ({ data }) => (
  <Card>
    <CardHeader>
      <CardTitle>Debug JSON</CardTitle>
    </CardHeader>
    <CardContent>
      <pre className="whitespace-pre-wrap text-sm">
        {JSON.stringify(data, null, 2)}
      </pre>
    </CardContent>
  </Card>
);

