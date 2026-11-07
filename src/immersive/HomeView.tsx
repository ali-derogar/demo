import { profile } from '../data/profile';

export function HomeView() {
  return (
    <div className="im-home">
      <div className="im-home__identity">
        <h1 id="im-home-title" dir="ltr">{profile.brand}</h1>
        <p>{profile.name}<span aria-hidden="true"> / </span>{profile.title}</p>
      </div>
      <a href="#demos" className="im-home__explore" data-cursor="link">
        <span>اسکرول کنید</span><span className="im-home__scroll-line" aria-hidden="true" /><span>کارها را کشف کنید</span>
      </a>
    </div>
  );
}
