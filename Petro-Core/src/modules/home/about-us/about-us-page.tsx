import { Mail, Github, Linkedin, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { SupabaseImage } from "@/components/ui/supabase-image";
import React from "react";

function AboutUsPage() {
  return (
    <div className="container mx-auto py-12 px-4 max-w-6xl relative">
      {/* Background Pattern */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
        <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-moss-700/30 blur-3xl" />
        <div className="absolute top-1/3 -right-24 w-96 h-96 rounded-full bg-sage-600/30 blur-3xl" />
        <div className="absolute -bottom-24 left-1/3 w-96 h-96 rounded-full bg-earth-700/20 blur-3xl" />
      </div>
      
      {/* Hero Section */}
      <section className="mb-16 text-center relative">
        <h1 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-moss-700 to-sage-500 bg-clip-text text-transparent">
          About PetroCore
        </h1>
        <div className="max-w-3xl mx-auto">
          <p className="text-lg leading-relaxed mb-6">
            PetroCore is a student-driven geoscience initiative founded by aspiring geologists from the
            University of Southeastern Philippines. Our platform is dedicated to delivering accessible, high-quality 
            educational content, tools, and insights in the fields of petrology, mineralogy, mineral
            exploration, geohazards, and environmental geoscience.
          </p>
          <p className="text-lg leading-relaxed mb-6">
            Rooted in academic excellence and real-world field experience, PetroCore bridges the gap
            between classroom learning and industry practice. We aim to empower geology students, early-career 
            professionals, and enthusiasts with resources that support learning, critical thinking, and
            professional growth.
          </p>
          <p className="text-lg font-medium">
            We believe that the future of geology lies in collaboration, innovation, and accessibility, and
            PetroCore is here to be part of that future.
          </p>
        </div>
      </section>

      {/* Vision Section */}
      <section className="mb-16 py-12 px-8 bg-sage-50 dark:bg-moss-900/30 rounded-xl relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-10">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-moss-600 to-transparent" />
          <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-moss-600 to-transparent" />
          <div className="absolute -left-6 top-1/2 transform -translate-y-1/2 text-[180px] text-moss-700 opacity-5 font-bold">
            VISION
          </div>
        </div>
        <h2 className="text-3xl font-bold mb-6 text-center">Our Vision</h2>
        <p className="text-xl text-center max-w-3xl mx-auto italic">
          "To become a leading student-led geoscience platform in the Philippines—where innovation,
          collaboration, and education converge to shape the future of geology."
        </p>
      </section>

      {/* Team Section */}
      <section className="relative py-12">
        <div className="absolute -left-4 top-10 h-40 w-1 bg-gradient-to-b from-transparent via-sage-600 to-transparent rounded-full" />
        <h2 className="text-3xl font-bold mb-12 text-center">Meet the Team</h2>
        
        {/* Team Photo */}
        <div className="mb-12 text-center">
          <div className="relative max-w-5xl mx-auto overflow-hidden rounded-lg shadow-xl">
            <SupabaseImage 
              src="/images/team/DEI_0676.jpg" 
              alt="PetroCore Team Photo"
              className="w-full h-auto object-cover"
              fallbackClassName="w-full h-[300px] bg-moss-100 flex items-center justify-center text-moss-700"
            />
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
              <p className="text-white text-sm font-medium">The PetroCore Development Team</p>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8">
          {/* Team Member 1 */}
          <TeamMember
            name="Xenia Gem G. Cubillas"
            title="Developer"
            description="Xenia is a BS Geology student at the University of Southeastern Philippines. She gained valuable field and industry experience during her internship at Apex Mining Company, Inc., focusing on mineral exploration. As a developer, she contributes to building PetroCore's technical foundation and digital interface."
            email="xeniagem08@gmail.com"
            github="https://github.com/xeniagc"
            avatarSrc="/images/team/xenia.jpg"
          />

          {/* Team Member 2 */}
          <TeamMember
            name="Jasper G. Gaviola"
            title="Developer"
            description="Jasper is a BS Geology student with hands-on experience in geohazard assessment and field mapping, gained during his internship at DENR–MGB Region I. Passionate about geological processes and educational outreach, Jasper helps shape PetroCore's academic content and user experience."
            email="jaspergav9@gmail.com"
            github="https://github.com/jaspergaviola"
            avatarSrc="/images/team/jasper.jpg"
          />

          {/* Team Member 3 */}
          <TeamMember
            name="John Andro E. Jarovilla"
            title="Developer"
            description="John Andro is pursuing a BS in Geology at the University of Southeastern Philippines. During his internship at DENR–MGB Region X, he worked on geohazard risk assessments. He plays a key role in PetroCore's back-end development and functionality."
            github="https://github.com/johnjarovilla"
            avatarSrc="/images/team/john.jpg"
          />

          {/* Team Member 4 */}
          <TeamMember
            name="Arianne Britney M. Josue"
            title="Developer"
            description="Arianne is a BS Geology student who interned at DENR–MGB Region XI, where she was involved in geological fieldwork and hazard mapping. She supports PetroCore's development and brings a detail-oriented approach to content design and organization."
            email="ariannejosuee@gmail.com"
            github="https://github.com/ariannejosue"
            avatarSrc="/images/team/arianne.jpg"
          />
        </div>
      </section>

      {/* Join Us Section */}
      <section className="text-center mb-16">
        <h2 className="text-3xl font-bold mb-6">Join Us</h2>
        <div className="max-w-3xl mx-auto mb-8">
          <p className="text-lg mb-6">
            PetroCore welcomes partnerships, collaborations, and contributions from students, professionals,
            and institutions who share our passion for geoscience. Together, let's uncover the Earth's story.
          </p>
          <p className="text-xl font-semibold">
            PetroCore — Geoscience in Motion.
          </p>
          <p className="text-lg italic mt-2">
            Empowering the next generation of geologists.
          </p>
        </div>
        <div className="flex justify-center gap-4">
          <a href="mailto:petrocore.usep@gmail.com">
            <Button className="gap-2 bg-moss-700 hover:bg-moss-800">
              <Mail className="h-4 w-4" />
              <span>Contact Us</span>
            </Button>
          </a>
          <a href="https://github.com/Petro-Core-USEP" target="_blank" rel="noopener noreferrer">
            <Button variant="outline" className="gap-2 border-moss-600 text-moss-700 hover:bg-moss-50 hover:text-moss-800">
              <Github className="h-4 w-4" />
              <span>GitHub</span>
            </Button>
          </a>
        </div>
      </section>

      {/* University Affiliation */}
      <section className="text-center">
        <p className="text-sm text-muted-foreground">
          Affiliated with the University of Southeastern Philippines, College of Science and Mathematics
        </p>
      </section>
    </div>
  );
}

interface TeamMemberProps {
  name: string;
  title: string;
  description: string;
  email?: string;
  github?: string;
  linkedin?: string;
  avatarSrc?: string;
}

function TeamMember({ name, title, description, email, github, linkedin, avatarSrc }: TeamMemberProps) {
  // Get initials for avatar fallback
  const initials = name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);

  const [imageError, setImageError] = React.useState(false);

  return (
    <Card className="overflow-hidden border-0 shadow-md hover:shadow-lg transition-shadow">
      <CardContent className="p-0">
        <div className="flex flex-col md:flex-row">
          <div className="md:w-1/3 bg-gradient-to-b from-moss-700 to-sage-500 p-6 flex justify-center items-center">
            <Avatar className="w-24 h-24 border-4 border-white">
              {avatarSrc && !imageError ? (
                <AvatarImage 
                  src={avatarSrc} 
                  alt={name}
                  onError={() => setImageError(true)} 
                />
              ) : null}
              <AvatarFallback className="text-lg font-bold bg-slate-200 text-moss-700">
                {initials}
              </AvatarFallback>
            </Avatar>
          </div>
          <div className="md:w-2/3 p-6">
            <h3 className="text-xl font-bold mb-1">{name}</h3>
            <p className="text-moss-600 dark:text-sage-400 font-medium mb-3">{title}</p>
            <p className="text-sm text-muted-foreground mb-4">{description}</p>
            <div className="flex gap-3">
              {email && (
                <a 
                  href={`mailto:${email}`} 
                  className="text-sm text-muted-foreground hover:text-moss-600 flex items-center gap-1"
                  title={email}
                >
                  <Mail className="h-4 w-4" />
                  <span className="hidden md:inline">{email}</span>
                </a>
              )}
              {github && (
                <a 
                  href={github}
                  target="_blank"
                  rel="noopener noreferrer" 
                  className="text-sm text-muted-foreground hover:text-moss-600 flex items-center gap-1"
                >
                  <Github className="h-4 w-4" />
                  <span className="hidden md:inline">GitHub</span>
                </a>
              )}
              {linkedin && (
                <a 
                  href={linkedin}
                  target="_blank"
                  rel="noopener noreferrer" 
                  className="text-sm text-muted-foreground hover:text-moss-600 flex items-center gap-1"
                >
                  <Linkedin className="h-4 w-4" />
                  <span className="hidden md:inline">LinkedIn</span>
                </a>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default AboutUsPage;
