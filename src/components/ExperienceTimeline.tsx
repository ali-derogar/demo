import { education, experiences } from '../data/profile';
import { Reveal } from './Reveal';

export function ExperienceTimeline() {
  return (
    <ol className="timeline" role="list">
      {experiences.map((entry) => (
        <Reveal as="li" key={`${entry.company}-${entry.role}`} className="timeline__item">
          <div className="timeline__node" aria-hidden="true" />
          <div className="timeline__card">
            <div className="timeline__head">
              <h3 className="timeline__role">{entry.role}</h3>
              <p className="timeline__period">
                {entry.periodFa}
                {entry.current && <span className="timeline__badge">فعال</span>}
              </p>
            </div>
            <p className="timeline__org">
              {entry.company} · {entry.location}
            </p>
            <ul className="timeline__points" role="list">
              {entry.points.map((point) => (
                <li key={point}>{point}</li>
              ))}
            </ul>
            <ul className="timeline__stack" role="list">
              {entry.stack.map((tech) => (
                <li key={tech} dir="ltr">
                  {tech}
                </li>
              ))}
            </ul>
          </div>
        </Reveal>
      ))}

      {education.map((item) => (
        <Reveal as="li" key={item.org} className="timeline__item">
          <div className="timeline__node timeline__node--edu" aria-hidden="true" />
          <div className="timeline__card">
            <h3 className="timeline__role">
              {item.degree} {item.field}
            </h3>
            <p className="timeline__org">
              {item.org} · {item.location}
            </p>
          </div>
        </Reveal>
      ))}
    </ol>
  );
}
