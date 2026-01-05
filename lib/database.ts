import { supabaseServer } from './supabase-server'
import bcrypt from 'bcrypt'

export class DatabaseService {
  static async getAccount(username: string) {
    const { data, error } = await supabaseServer
      .from('account')
      .select('password_hash, event, default_mode')
      .eq('username', username)
      .single()
    
    if (error) throw error
    return data
  }

  static async verifyPassword(username: string, plainPassword: string) {
    const { data, error } = await supabaseServer
      .from('account')
      .select('password_hash')
      .eq('username', username)
      .single()
    
    if (error || !data?.password_hash) return false
    
    return bcrypt.compareSync(plainPassword, data.password_hash)
  }

  static async getAllAccounts() {
    const { data, error } = await supabaseServer
      .from('account')
      .select('username, web_event, default_mode')
    
    if (error) throw error
    return data || []
  }

  static async getPlayersByUsername(username: string) {
    const { data, error } = await supabaseServer
      .from('player_info')
      .select('dupr_id, name, partner_number')
      .like('dupr_id', `%_${username}`)
      .order('name')
    
    if (error) throw error
    return data
  }

  static async getScoresByUsername(username: string) {
    const { data, error } = await supabaseServer
      .from('score')
      .select('serial_number, player_a1, player_a2, player_b1, player_b2, team_a_score, team_b_score, lock, check, court, updated_time')
      .like('serial_number', `%_${username}`)
      .order('serial_number')
    
    if (error) throw error
    return data || []
  }

  static async upsertPlayers(players: any[], username: string) {
    const playersData = Array.isArray(players) ? players : [players]
    const formattedData = playersData.map(player => ({
      dupr_id: `${player.dupr_id}_${username}`,
      name: player.name,
      partner_number: player.partner_number
    }))
    
    const { data, error } = await supabaseServer
      .from('player_info')
      .upsert(formattedData, { onConflict: 'dupr_id' })
    
    if (error) throw error
    return data
  }

  static async updatePlayer(player: any, originalId: string, username: string) {
    const { data, error } = await supabaseServer
      .from('player_info')
      .update({
        dupr_id: `${player.dupr_id}_${username}`,
        name: player.name,
        partner_number: player.partner_number
      })
      .eq('dupr_id', `${originalId}_${username}`)
    
    if (error) throw error
    return data
  }

  static async deletePlayer(duprId: string, username: string) {
    const { error } = await supabaseServer
      .from('player_info')
      .delete()
      .eq('dupr_id', `${duprId}_${username}`)
    
    if (error) throw error
  }

  static async deleteAllPlayers(username: string) {
    const { error } = await supabaseServer
      .from('player_info')
      .delete()
      .like('dupr_id', `%_${username}`)
    
    if (error) throw error
  }

  static async upsertScore(score: any) {
    const { data, error } = await supabaseServer
      .from('score')
      .upsert(score)
      .select()
    
    if (error) throw error
    return data?.[0] || {}
  }

  static async insertScore(score: any) {
    const { data, error } = await supabaseServer
      .from('score')
      .insert(score)
      .select()
    
    if (error) throw error
    return data?.[0] || {}
  }

  static async deleteScore(serialNumber: string) {
    const { error } = await supabaseServer
      .from('score')
      .delete()
      .eq('serial_number', serialNumber)
    
    if (error) throw error
  }

  static async deleteAllScores(username: string) {
    const { error } = await supabaseServer
      .from('score')
      .delete()
      .like('serial_number', `%_${username}`)
    
    if (error) throw error
  }
}
