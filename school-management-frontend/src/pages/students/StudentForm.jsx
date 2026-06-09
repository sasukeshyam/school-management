import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQuery } from '@tanstack/react-query'
import { studentsAPI, classSetupsAPI, sessionsAPI } from '@/api'
import { Input, Label, Select } from '@/components/ui/index.jsx'
import { Button } from '@/components/ui/Button'
import { toast } from '@/hooks/useToast'
import { cn } from '@/utils/cn'

const schema = z.object({
  name:           z.string().min(2, 'Name required'),
  email:          z.string().email('Valid email required'),
  phone:          z.string().optional(),
  roll_number:    z.string().optional(),
  admission_no:   z.string().optional(),
  gender:         z.string().optional(),
  blood_group:    z.string().optional(),
  dob:            z.string().optional(),
  address:        z.string().optional(),
  class_setup_id: z.string().optional(),
  session_id:     z.string().optional(),
})

export const StudentForm = ({ initial, onSuccess, onCancel }) => {
  const { data: classSetups } = useQuery({
    queryKey: ['class-setups-all'],
    queryFn:  () => classSetupsAPI.getAll({ limit: 100 }).then((r) => r.data.data),
  })
  const { data: sessions } = useQuery({
    queryKey: ['sessions-all'],
    queryFn:  () => sessionsAPI.getAll({ limit: 20 }).then((r) => r.data.data),
  })

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver:      zodResolver(schema),
    defaultValues: {
      name:           initial?.user_id?.name || '',
      email:          initial?.user_id?.email || '',
      phone:          initial?.user_id?.phone || '',
      roll_number:    initial?.roll_number    || '',
      admission_no:   initial?.admission_no   || '',
      gender:         initial?.gender         || '',
      blood_group:    initial?.blood_group    || '',
      dob:            initial?.dob?.split('T')[0] || '',
      address:        initial?.address        || '',
      class_setup_id: initial?.class_setup_id?._id || '',
      session_id:     initial?.session_id?._id     || '',
    },
  })

  const mutation = useMutation({
    mutationFn: (data) => initial
      ? studentsAPI.update(initial._id, data)
      : studentsAPI.create(data),
    onSuccess: () => {
      toast.success(initial ? 'Student updated' : 'Student created')
      onSuccess?.()
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed to save'),
  })

  const fields = (label, name, opts = {}) => (
    <div className="space-y-1.5">
      <Label htmlFor={name}>{label}</Label>
      <Input id={name} {...register(name)} className={cn(errors[name] && 'border-destructive')} {...opts} />
      {errors[name] && <p className="text-xs text-destructive">{errors[name].message}</p>}
    </div>
  )

  return (
    <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        {fields('Full Name *', 'name', { placeholder: 'Student full name' })}
        {fields('Email *', 'email', { type: 'email', placeholder: 'student@school.com' })}
        {fields('Phone', 'phone', { placeholder: '+91 XXXXX XXXXX' })}
        {fields('Roll Number', 'roll_number', { placeholder: 'e.g. 001' })}
        {fields('Admission No', 'admission_no', { placeholder: 'e.g. ADM2024001' })}
        {fields('Date of Birth', 'dob', { type: 'date' })}

        <div className="space-y-1.5">
          <Label>Gender</Label>
          <Select {...register('gender')}>
            <option value="">Select gender</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label>Blood Group</Label>
          <Select {...register('blood_group')}>
            <option value="">Select</option>
            {['A+','A-','B+','B-','AB+','AB-','O+','O-'].map((g) => (
              <option key={g} value={g}>{g}</option>
            ))}
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label>Class</Label>
          <Select {...register('class_setup_id')}>
            <option value="">Select class</option>
            {(classSetups || []).map((cs) => (
              <option key={cs._id} value={cs._id}>
                {cs.class_id?.name} {cs.section_id?.name}
              </option>
            ))}
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label>Session</Label>
          <Select {...register('session_id')}>
            <option value="">Select session</option>
            {(sessions || []).map((s) => (
              <option key={s._id} value={s._id}>{s.name}</option>
            ))}
          </Select>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>Address</Label>
        <Input {...register('address')} placeholder="Student address" />
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit" loading={mutation.isPending}>
          {initial ? 'Update Student' : 'Create Student'}
        </Button>
      </div>
    </form>
  )
}
