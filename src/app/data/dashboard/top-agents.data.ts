export interface Agent {
  name: string;
  role: string;
  resolved: number;
  satisfaction: number;
  avatar: string;
}

export const topAgents: Agent[] = [
  { name: 'منى خالد', role: 'مندوب دعم', resolved: 142, satisfaction: 98, avatar: 'https://ui-avatars.com/api/?name=Mona+Khaled&background=6ec1e4&color=fff' },
  { name: 'أحمد سامي', role: 'مندوب دعم', resolved: 128, satisfaction: 96, avatar: 'https://ui-avatars.com/api/?name=Ahmed+Sami&background=61ce70&color=fff' },
  { name: 'سارة نبيل', role: 'مشرفة', resolved: 115, satisfaction: 94, avatar: 'https://ui-avatars.com/api/?name=Sara+Nabil&background=f59e0b&color=fff' },
  { name: 'خالد Omar', role: 'مندوب دعم', resolved: 98, satisfaction: 92, avatar: 'https://ui-avatars.com/api/?name=Khaled+Omar&background=dc2626&color=fff' },
];
