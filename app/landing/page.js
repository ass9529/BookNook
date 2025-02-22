import React from 'react';
import { Bell, BookOpen } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const BookClubsPage = () => {
  const notifications = [
    { id: 1, title: "New book selection for 'Mystery Lovers'", description: "Vote for next month's book by Friday!" },
    { id: 2, title: "Upcoming meeting: SciFi Enthusiasts", description: "Discussion on 'Project Hail Mary' this Saturday" },
  ];

  const bookClubs = [
    {
      id: 1,
      name: "Mystery Lovers",
      members: 24,
      currentBook: "The Thursday Murder Club",
      topPosts: [
        { id: 1, title: "Theory about the ending", likes: 15, comments: 8 },
        { id: 2, title: "Character analysis: Joyce", likes: 12, comments: 5 },
      ]
    },
    {
      id: 2,
      name: "SciFi Enthusiasts",
      members: 31,
      currentBook: "Project Hail Mary",
      topPosts: [
        { id: 1, title: "The science behind the Astrophage", likes: 22, comments: 14 },
        { id: 2, title: "Rocky's communication system explained", likes: 18, comments: 10 },
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <h1 className="text-3xl font-bold text-gray-900 text-center">Welcome</h1>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Notifications Section */}
        <section className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Bell className="w-5 h-5" />
            <h2 className="text-xl font-semibold">Recent Notifications</h2>
          </div>
          <div className="space-y-4">
            {notifications.map(notification => (
              <Alert key={notification.id}>
                <AlertTitle>{notification.title}</AlertTitle>
                <AlertDescription>{notification.description}</AlertDescription>
              </Alert>
            ))}
          </div>
        </section>

        {/* Book Clubs Tabs */}
        <section className="max-w-4xl mx-auto">
          <div className="flex items-center gap-2 mb-6">
            <BookOpen className="w-5 h-5" />
            <h2 className="text-xl font-semibold">Your Book Clubs</h2>
          </div>
          
          <Tabs defaultValue={bookClubs[0].id.toString()} className="w-full">
            <TabsList className="w-full flex bg-gray-100 rounded-lg p-1">
              {bookClubs.map((club) => (
                <TabsTrigger
                  key={club.id}
                  value={club.id.toString()}
                  className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium data-[state=active]:bg-white data-[state=active]:shadow-md"
                >
                  {club.name}
                  <span className="ml-2 px-2 py-1 bg-gray-200 rounded-full text-xs text-gray-700">
                    {club.members}
                  </span>
                </TabsTrigger>
              ))}
            </TabsList>

            {bookClubs.map((club) => (
              <TabsContent key={club.id} value={club.id.toString()} className="mt-4">
                <Card className="shadow-lg border bg-white rounded-lg">
                  <CardContent className="pt-6 px-6">
                    {/* Currently Reading Section */}
                    <div className="mb-6">
                      <p className="text-sm text-gray-500">Currently Reading</p>
                      <p className="text-2xl font-bold">{club.currentBook}</p>
                    </div>

                    {/* Top Discussions */}
                    <div>
                      <p className="text-sm text-gray-500 mb-4">Top Discussions</p>
                      <div className="space-y-4">
                        {club.topPosts.map((post) => (
                          <div
                            key={post.id}
                            className="bg-gray-100 p-4 rounded-xl hover:bg-gray-200 transition-all cursor-pointer shadow-sm"
                          >
                            <p className="font-semibold">{post.title}</p>
                            <div className="flex gap-4 mt-2 text-sm text-gray-600">
                              <span>{post.likes} likes</span>
                              <span>{post.comments} comments</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            ))}
          </Tabs>

        </section>
      </div>
    </div>
  );
};

export default BookClubsPage;