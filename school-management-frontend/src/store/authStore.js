import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user:        null,
      accessToken: null,
      roles:       [],
      permissions: [],
      schoolId:    null,

      setAuth: ({ user, access_token, roles }) =>
        set({
          user,
          accessToken: access_token,
          roles:       roles || [],
          schoolId:    user?.school_id,
        }),

      setAccessToken: (token) => set({ accessToken: token }),

      setPermissions: (permissions) => set({ permissions }),

      logout: () => set({ user: null, accessToken: null, roles: [], permissions: [], schoolId: null }),

      hasRole:       (role)       => get().roles.includes(role),
      hasPermission: (permission) => get().permissions.includes(permission) || get().permissions.includes('super_admin'),
      isSuperAdmin:  ()           => get().roles.includes('super_admin'),
      isAdmin:       ()           => get().roles.includes('admin') || get().roles.includes('super_admin'),
      isTeacher:     ()           => get().roles.includes('teacher'),
      isStudent:     ()           => get().roles.includes('student'),
      isParent:      ()           => get().roles.includes('parent'),
    }),
    {
      name:    'auth-store',
      partialize: (state) => ({
        user:        state.user,
        accessToken: state.accessToken,
        roles:       state.roles,
        schoolId:    state.schoolId,
      }),
    }
  )
)
