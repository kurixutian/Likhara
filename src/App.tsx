import { useState } from 'react';
import ProjectHome from './ProjectHome';
import LikharaEditor from './likhara/LikharaEditor';
import { setActiveProjectId } from './likhara/projects/storage';
import type { LikharaProject } from './likhara/core';

type Route =
  | { view: 'home' }
  | { view: 'editor'; project: LikharaProject };

export default function App() {
  const [route, setRoute] = useState<Route>({ view: 'home' });

  if (route.view === 'home') {
    return (
      <ProjectHome
        onOpenProject={(project) => {
          setActiveProjectId(project.id);
          setRoute({ view: 'editor', project });
        }}
      />
    );
  }

  // Keyed by project id: editor state (history, selection, canvas) is fully
  // rebuilt per project so no state can leak between projects.
  return (
    <LikharaEditor
      key={route.project.id}
      project={route.project}
      onExit={() => {
        setActiveProjectId(null);
        setRoute({ view: 'home' });
      }}
    />
  );
}
