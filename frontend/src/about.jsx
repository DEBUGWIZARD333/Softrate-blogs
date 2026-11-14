function About() {
  return (
    <div className="page-box">
      <h2>About Softrate Blog</h2>
      <p className="page-lead">
        Softrate Blog is an engineering publication covering modern software development,
        cloud architectures, and practical technical tutorials.
      </p>

      <div className="about-text-content">
        <h3>Our Objective</h3>
        <p>
          We created this blog to document technical insights gained from real-world projects.
          Rather than high-level overviews, our articles focus on implementation details, architecture
          trade-offs, and practical code examples that developers can use in production.
        </p>

        <h3>Topics We Focus On</h3>
        <p>
          Our writing covers full-stack web engineering, artificial intelligence workflows, cloud
          infrastructure, and application security. Every article is written and reviewed by developers
          working in the field.
        </p>

        <h3>About the Company</h3>
        <p>
          Softrate Technologies is a software solutions firm specializing in full-stack web applications,
          cloud migrations, and enterprise software systems. This publication is maintained by our
          engineering team.
        </p>
      </div>
    </div>
  );
}

export default About;
