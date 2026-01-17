import { ExternalLink, Phone, BookOpen, Scale } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const resources = [
  {
    icon: Scale,
    title: 'BC Residential Tenancy Branch',
    description: 'Official government resource for tenant rights and dispute resolution in British Columbia.',
    link: 'https://www2.gov.bc.ca/gov/content/housing-tenancy/residential-tenancies',
    phone: '1-800-665-8779'
  },
  {
    icon: BookOpen,
    title: 'Tenant Resource & Advisory Centre',
    description: 'Non-profit providing legal education and advocacy for BC tenants.',
    link: 'https://tenants.bc.ca/'
  },
  {
    icon: Phone,
    title: 'UBC Student Legal Fund',
    description: 'Free legal advice for UBC students on tenancy matters.',
    link: 'https://www.ams.ubc.ca/services/student-legal-fund/'
  },
  {
    icon: Phone,
    title: 'SFU Student Services',
    description: 'Resources and support for SFU students dealing with housing issues.',
    link: 'https://www.sfu.ca/students/residences.html'
  }
];

export function Resources() {
  return (
    <section id="resources" className="py-20">
      <div className="container">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Helpful Resources</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Need more help? Here are some valuable resources for BC tenants
          </p>
        </div>
        
        <div className="grid gap-6 md:grid-cols-2">
          {resources.map((resource) => (
            <Card key={resource.title}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <resource.icon className="w-5 h-5 text-primary" />
                  </div>
                  <Button variant="ghost" size="icon" asChild>
                    <a href={resource.link} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </Button>
                </div>
                <CardTitle className="text-lg">{resource.title}</CardTitle>
                <CardDescription>{resource.description}</CardDescription>
              </CardHeader>
              {resource.phone && (
                <CardContent>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Phone className="w-4 h-4" />
                    <a href={`tel:${resource.phone}`} className="hover:text-foreground transition-colors">
                      {resource.phone}
                    </a>
                  </div>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
