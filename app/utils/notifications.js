import supabase from '../supabaseClient';

export const createNotification = async (clubId, userId, title, description, type) => {
  const { data, error } = await supabase
    .from('notifications')
    .insert([{
      user_id: userId,
      title,
      club_id: clubId,
      description,
      type
    }])
    .select();

  if (error) {
    console.error('Error creating notification:', error);
    return null;
  }

  return data[0];
};

export const notifyAllClubMembers = async (clubId, title, description, type) => {
  // Get all members of the club
  const { data: members, error } = await supabase
    .from('club_members')
    .select('user_id')
    .eq('club_id', clubId);

  if (error) {
    console.error('Error fetching club members:', error);
    return;
  }

  // Create notifications for each member
  const notifications = members.map(member => ({
    user_id: member.user_id,
    club_id: clubId,
    title,
    description,
    type,
    is_read: false
  }));

  const { data, error: insertError } = await supabase
    .from('notifications')
    .insert(notifications);

  if (insertError) {
    console.error('Error creating notifications:', insertError);
  }

  return data;
};