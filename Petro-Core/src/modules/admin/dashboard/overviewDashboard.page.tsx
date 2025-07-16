import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DollarSign,
  MessageSquareWarningIcon,
  Timer,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from 'recharts';
import type { StatCardProps, ChartConfig } from './types';
import { PersonIcon } from '@radix-ui/react-icons';
import axios from 'axios';
import { getAuthToken } from '../rocks/services';
import { supabase } from '@/lib/supabase';

const medicineAvailabilityData = [
  { month: 'Jan', pharmacy1: 12, pharmacy2: 90, pharmacy3: 75 },
  { month: 'Feb', pharmacy1: 85, pharmacy2: 88, pharmacy3: 78 },
  { month: 'Mar', pharmacy1: 3, pharmacy2: 92, pharmacy3: 80 },
  { month: 'Apr', pharmacy1: 88, pharmacy2: 95, pharmacy3: 82 },
  { month: 'May', pharmacy1: 90, pharmacy2: 91, pharmacy3: 85 },
  { month: 'Jun', pharmacy1: 92, pharmacy2: 93, pharmacy3: 88 },
  { month: 'Jul', pharmacy1: 89, pharmacy2: 94, pharmacy3: 86 },
  { month: 'Aug', pharmacy1: 91, pharmacy2: 96, pharmacy3: 87 },
  { month: 'Sep', pharmacy1: 93, pharmacy2: 97, pharmacy3: 89 },
  { month: 'Oct', pharmacy1: 95, pharmacy2: 98, pharmacy3: 90 },
  { month: 'Nov', pharmacy1: 94, pharmacy2: 97, pharmacy3: 91 },
  { month: 'Dec', pharmacy1: 96, pharmacy2: 99, pharmacy3: 92 },
];

const pharmacyPopularityData = [
  { name: 'PharmaCare', value: 35 },
  { name: 'MediLife', value: 10 },
  { name: 'HealthRx', value: 25 },
  { name: 'WellPharm', value: 10 },
];

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

const medicineChartConfig = {
  pharmacy1: {
    label: 'New Users',
    color: 'hsl(var(--chart-1))',
  },
  pharmacy2: {
    label: 'Active Users',
    color: 'hsl(var(--chart-2))',
  },
  pharmacy3: {
    label: 'Total Logins',
    color: 'hsl(var(--chart-3))',
  },
} as ChartConfig;

export default function OverviewDashboard() {
  const [timeRange, setTimeRange] = useState('6m');
  const [totalUsers, setTotalUsers] = useState<number | null>(null);
  const cookie = JSON.parse(localStorage.getItem('sb-tobjghstopxuntbewrxu-auth-token') || '{}')
  const fetchTotalUsers = async () => {
    try {
      // const token =  cookie.access_token
      // console.log('Token : ', token)
      // const response = await axios.get('https://petro-core-usep.onrender.com/api/users/countUsers', {
      //   headers: {
      //      'Content-type' : 'application/json',
      //     Authorization: `Bearer ${token}`
      //   },
      //   withCredentials: true
      // })

    const { count, error } = await supabase
      .from('students')
      .select('*', { count: 'exact', head: true });

    if (error) {
      console.error('Error fetching total users:', error);
    }
    
    console.log('Total users:', count);
    setTotalUsers(count);
     
      // console.log(" response : ", response)
   
      // console.log("Data : ", data)
      // setTotalUsers(data.totalUsers);
    } catch (error) {
      console.error('Error fetching total users:', error);
    }
  };
  useEffect(() => {
    fetchTotalUsers();

    return () => {
      setTotalUsers(null)
    }
  }, []);

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 bg-background">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold"> Dashboard</h1>
        <Select defaultValue={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select time range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1m">Last Month</SelectItem>
            <SelectItem value="3m">Last 3 Months</SelectItem>
            <SelectItem value="6m">Last 6 Months</SelectItem>
            <SelectItem value="1y">Last Year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={<PersonIcon className="h-4 w-4" />}
          title="Total Students"
          value={totalUsers?.toString() ?? 'Loading...'}
        />

        <StatCard
          icon={<Timer className="h-4 w-4" />}
          title="Active Students"
          value="42"
          trend={3.7}
        />
        <StatCard
          icon={<MessageSquareWarningIcon className="h-4 w-4" />}
          title="Total Rocks"
          value="156"
          trend={5.2}
        />
        <StatCard
          icon={<DollarSign className="h-4 w-4" />}
          title="Total Minerals"
          value="89"
          trend={2.3}
        />
      </div>

      <div className="grid w-full gap-4 grid-cols-1">
        <Card className="col-span-2 md:col-span-3 w-full">
          <CardHeader>
            <CardTitle>Student Login Activity</CardTitle>
            <CardDescription>
              Monthly student login trends throughout the year
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={medicineChartConfig}
              className="h-[250px] w-full"
            >
              <AreaChart
                data={medicineAvailabilityData}
                margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />

                <Area
                  type="monotone"
                  dataKey="pharmacy2"
                  stackId="1"
                  stroke="var(--color-pharmacy2)"
                  fill="var(--color-pharmacy2)"
                />
                <Area
                  type="monotone"
                  dataKey="pharmacy3"
                  stackId="1"
                  stroke="var(--color-pharmacy3)"
                  fill="var(--color-pharmacy3)"
                />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* <div className="grid gap-4 md:grid-cols-3">
        <Card className="col-span-3 md:col-span-1">
          <CardHeader>
            <CardTitle>Pharmacy Popularity</CardTitle>
            <CardDescription>
              Distribution of medicine availability
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pharmacyPopularityData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pharmacyPopularityData.map((_, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <ChartTooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
          <CardFooter>
            <div className="w-full space-y-1">
              {pharmacyPopularityData.map((item, index) => (
                <div key={item.name} className="flex items-center">
                  <div
                    className="w-2 h-2 mr-2 rounded-full"
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  />
                  <div className="flex-1 text-sm">{item.name}</div>
                  <div className="text-sm font-medium">{item.value}%</div>
                </div>
              ))}
            </div>
          </CardFooter>
        </Card>

        <Card className="col-span-3 md:col-span-2">
          <CardHeader>
            <CardTitle>Medication Refill Progress</CardTitle>
            <CardDescription>
              Track the progress of ongoing medication refills
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <ProgressItem label="Heart Medication" progress={75} />
              <ProgressItem label="Diabetes Medication" progress={40} />
              <ProgressItem label="Pain Relief" progress={90} />
              <ProgressItem label="Blood Pressure Medication" progress={60} />
            </div>
          </CardContent>
        </Card>
      </div> */}
    </div>
  );
}

function StatCard({ icon, title, value, trend = 0 }: StatCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p
          className={`text-xs ${
            trend >= 0 ? 'text-green-500' : 'text-red-500'
          } flex items-center`}
        >
          {trend >= 0 ? (
            <TrendingUp className="h-4 w-4 mr-1" />
          ) : (
            <TrendingDown className="h-4 w-4 mr-1" />
          )}
          {Math.abs(trend)}% from last
        </p>
      </CardContent>
    </Card>
  );
}
function ProgressItem({
  label,
  progress,
}: {
  label: string;
  progress: number;
}) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span>{label}</span>
        <span>{progress}%</span>
      </div>
      <Progress value={progress} className="w-full" />
    </div>
  );
}
