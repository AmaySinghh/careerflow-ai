import sys
sys.path.append("/app")

from app.database import SessionLocal
from app.models.job import Job

jobs = [
    Job(title="Python Backend Developer", company="Infosys", location="Pune, Maharashtra", salary_min=500000, salary_max=800000, description="Build and maintain REST APIs using FastAPI and Django. Work with PostgreSQL and Redis. 0-2 years experience welcome.", source_url="https://infosys.com/careers", source_id="infosys-py-001"),
    Job(title="React Frontend Developer", company="TCS", location="Mumbai, Maharashtra", salary_min=450000, salary_max=750000, description="Develop responsive web applications using React 18, TypeScript, and Tailwind CSS. Collaborate with backend teams on API integration.", source_url="https://tcs.com/careers", source_id="tcs-react-001"),
    Job(title="Full Stack Developer", company="Wipro", location="Bangalore, Karnataka", salary_min=600000, salary_max=900000, description="Work on both frontend (React) and backend (Node.js/Python) of enterprise applications. Experience with Docker and AWS preferred.", source_url="https://wipro.com/careers", source_id="wipro-fs-001"),
    Job(title="Junior Software Engineer", company="Zoho", location="Chennai, Tamil Nadu", salary_min=400000, salary_max=650000, description="Fresh graduates welcome. Work on Zoho's suite of SaaS products. Strong DSA fundamentals required. Training provided.", source_url="https://zoho.com/careers", source_id="zoho-jr-001"),
    Job(title="Backend Engineer - Python", company="Razorpay", location="Bangalore, Karnataka", salary_min=700000, salary_max=1000000, description="Build payment processing systems at scale. Python, FastAPI, PostgreSQL, and Kafka experience preferred. 1-3 years experience.", source_url="https://razorpay.com/careers", source_id="razorpay-py-001"),
    Job(title="Software Development Engineer", company="Amazon", location="Hyderabad, Telangana", salary_min=800000, salary_max=1200000, description="SDE-1 role working on AWS infrastructure tools. Strong CS fundamentals, system design basics, and coding skills required.", source_url="https://amazon.jobs", source_id="amazon-sde-001"),
    Job(title="React Native Developer", company="PhonePe", location="Bangalore, Karnataka", salary_min=600000, salary_max=850000, description="Build cross-platform mobile applications using React Native. Experience with state management (Redux/Zustand) preferred.", source_url="https://phonepe.com/careers", source_id="phonepe-rn-001"),
    Job(title="DevOps Engineer", company="Freshworks", location="Chennai, Tamil Nadu", salary_min=550000, salary_max=800000, description="Manage CI/CD pipelines, Docker, Kubernetes, and AWS infrastructure. Experience with Terraform and monitoring tools preferred.", source_url="https://freshworks.com/careers", source_id="freshworks-devops-001"),
    Job(title="Data Engineer", company="Flipkart", location="Bangalore, Karnataka", salary_min=700000, salary_max=1000000, description="Build data pipelines using Python, Apache Spark, and Airflow. Work with large-scale distributed systems and data warehousing.", source_url="https://flipkart.com/careers", source_id="flipkart-de-001"),
    Job(title="Software Engineer - Fresher", company="HCL Technologies", location="Noida, Uttar Pradesh", salary_min=350000, salary_max=500000, description="Fresher role for B.Tech graduates. Training in Java, Python, and cloud technologies provided. 2024/2025 batch preferred.", source_url="https://hcltech.com/careers", source_id="hcl-fresher-001"),
    Job(title="Frontend Engineer", company="Swiggy", location="Bangalore, Karnataka", salary_min=650000, salary_max=900000, description="Build high-performance React applications for food delivery platform serving millions of users. Strong CSS and performance optimization skills needed.", source_url="https://swiggy.com/careers", source_id="swiggy-fe-001"),
    Job(title="Python Django Developer", company="Ola", location="Bangalore, Karnataka", salary_min=500000, salary_max=750000, description="Develop backend services for ride-sharing platform using Django REST Framework. Experience with geospatial data and real-time systems a plus.", source_url="https://ola.com/careers", source_id="ola-django-001"),
    Job(title="Associate Software Engineer", company="Accenture", location="Pune, Maharashtra", salary_min=380000, salary_max=550000, description="Entry-level role for recent graduates. Work on enterprise software projects for global clients. Training and mentorship provided.", source_url="https://accenture.com/careers", source_id="accenture-ase-001"),
    Job(title="Backend Developer - Node.js", company="CRED", location="Bangalore, Karnataka", salary_min=700000, salary_max=1000000, description="Build scalable microservices for fintech platform. Node.js, PostgreSQL, Redis, and Kafka experience preferred. 1-3 years experience.", source_url="https://cred.club/careers", source_id="cred-node-001"),
    Job(title="Software Engineer - Robotics & Automation", company="Siemens India", location="Pune, Maharashtra", salary_min=600000, salary_max=850000, description="Work at the intersection of software and industrial automation. Python, ROS, and embedded systems experience preferred. B.Tech in Robotics/Mechanical/ECE welcome.", source_url="https://siemens.com/careers", source_id="siemens-robotics-001"),
]


def seed():
    db = SessionLocal()
    try:
        existing = db.query(Job).count()
        if existing > 0:
            print(f"Jobs table already has {existing} records. Skipping seed.")
            return
        db.add_all(jobs)
        db.commit()
        print(f"Successfully seeded {len(jobs)} jobs.")
    except Exception as e:
        db.rollback()
        print(f"Error seeding jobs: {e}")
    finally:
        db.close()


if __name__ == "__main__":
    seed()