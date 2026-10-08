import { useEffect, useState } from 'preact/hooks';
import { ALL_LESSONS, REVIEWED } from '../content/catalog';
import { releasedLessons } from '../content/release';
import { invariant } from '../lib/invariant';
import { localDay } from '../progress/dates';
import { dueItems } from '../progress/leitner';
import { displayedStreak } from '../progress/xpStreak';
import { useStore } from './appStore';
import { Banners } from './Banners';
import { LessonPlayer } from './LessonPlayer';
import { PathView } from './PathView';
import { Playground } from './Playground';
import { ReviewSession } from './ReviewSession';
import { Settings } from './Settings';

/** Preview builds (dev, or VITE_PREVIEW_ALL=1) show lessons before their answer keys are reviewed. */
const PREVIEW_ALL = import.meta.env.DEV || import.meta.env.VITE_PREVIEW_ALL === '1';

function useHashRoute(): [string, (r: string) => void] {
  const [route, setRoute] = useState(window.location.hash || '#/');
  useEffect(() => {
    const on = (): void => { setRoute(window.location.hash || '#/'); window.scrollTo(0, 0); };
    window.addEventListener('hashchange', on);
    return () => { window.removeEventListener('hashchange', on); };
  }, []);
  return [route, (r: string) => { window.location.hash = r; }];
}

export function App() {
  const store = useStore();
  const [route, go] = useHashRoute();
  const released = releasedLessons(ALL_LESSONS, REVIEWED, PREVIEW_ALL);
  const today = localDay(new Date());
  const due = dueItems(store.progress.leitner, today);
  invariant(released.length <= ALL_LESSONS.length, 'released lessons are a subset');
  const lessonId = route.startsWith('#/lesson/') ? route.slice('#/lesson/'.length) : null;
  const lesson = lessonId === null ? undefined : released.find((l) => l.id === lessonId);
  const exit = (): void => { go('#/'); };
  let page;
  if (lesson !== undefined) page = <LessonPlayer key={lesson.id} lesson={lesson} onExit={exit} />;
  else if (route === '#/review') page = <ReviewSession due={due} onExit={exit} />;
  else if (route === '#/settings') page = <Settings store={store} />;
  else if (route === '#/playground') page = <Playground />;
  else page = <PathView released={released} progress={store.progress} dueCount={due.length} go={go} />;
  const inLesson = lesson !== undefined || route === '#/review';
  return (
    <div class="app">
      {!inLesson && <Header xp={store.progress.xp} streak={displayedStreak(store.progress.streak, today)} due={due.length} route={route} />}
      {PREVIEW_ALL && !inLesson && <p class="banner banner-preview">Preview build: lessons are shown before their answer keys are checked.</p>}
      {!inLesson && <Banners store={store} go={go} />}
      <main id="main">{page}</main>
    </div>
  );
}

function Header({ xp, streak, due, route }: { readonly xp: number; readonly streak: number; readonly due: number; readonly route: string }) {
  invariant(xp >= 0 && streak >= 0, 'stats are non-negative');
  const link = (href: string, label: string) => <a href={href} class={route === href ? 'nav-on' : ''} aria-current={route === href ? 'page' : undefined}>{label}</a>;
  return (
    <header class="top">
      <a class="brand" href="#/">Physics Playground</a>
      <nav aria-label="Main">{link('#/', 'Learn')}{link('#/playground', 'Playground')}{link('#/settings', 'Progress')}</nav>
      <dl class="stats">
        <div><dt>Streak</dt><dd>{streak} day{streak === 1 ? '' : 's'}</dd></div>
        <div><dt>XP</dt><dd>{xp}</dd></div>
        <div><dt>Review</dt><dd>{due} due</dd></div>
      </dl>
    </header>
  );
}
