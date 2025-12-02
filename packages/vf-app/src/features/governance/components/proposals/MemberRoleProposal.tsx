'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { ProfileAvatar } from '@/components/ui/profile-avatar';
import { SearchInput } from '@/components/ui/search-input';
import { useMultipleProfiles } from '@/hooks/use-profile';
import { AddressInput } from '../shared/AddressInput';
import type { ProposalComponentProps } from '../shared/types';

interface MemberRoleProposalProps extends ProposalComponentProps {
  actionType: 'AddMemberToRole' | 'RemoveMemberFromRole';
}

export function MemberRoleProposal({
  formData,
  onFormDataChange,
  validationErrors,
  policy,
  actionType,
  onValidationChange,
}: MemberRoleProposalProps) {
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);
  const [memberDropdownOpen, setMemberDropdownOpen] = useState(false);
  const [memberSearch, setMemberSearch] = useState('');
  const roleRef = useRef<HTMLDivElement>(null);
  const memberRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const isRemoveAction = actionType === 'RemoveMemberFromRole';

  // Get members of the selected role (for RemoveMemberFromRole)
  const roleMembers = useMemo(() => {
    if (!policy || !formData.role) return [];
    const selectedRole = policy.roles.find(r => r.name === formData.role);
    if (!selectedRole || typeof selectedRole.kind === 'string') return [];
    // kind is { Group: string[] }
    const kind = selectedRole.kind as { Group?: string[] };
    return kind.Group ?? [];
  }, [policy, formData.role]);

  // Fetch profile images for role members
  const { getProfileImageUrl } = useMultipleProfiles(roleMembers);

  // Filter members based on search
  const filteredMembers = useMemo(() => {
    if (!memberSearch) return roleMembers;
    const search = memberSearch.toLowerCase();
    return roleMembers.filter(member => member.toLowerCase().includes(search));
  }, [roleMembers, memberSearch]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (roleRef.current && !roleRef.current.contains(event.target as Node)) {
        setRoleDropdownOpen(false);
      }
      if (memberRef.current && !memberRef.current.contains(event.target as Node)) {
        setMemberDropdownOpen(false);
        setMemberSearch('');
      }
    };

    if (roleDropdownOpen || memberDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [roleDropdownOpen, memberDropdownOpen]);

  // Focus search input when member dropdown opens
  useEffect(() => {
    if (memberDropdownOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [memberDropdownOpen]);

  // Clear member selection when role changes (for remove action)
  useEffect(() => {
    if (isRemoveAction && formData.memberId) {
      // Check if current member is still in the new role
      if (!roleMembers.includes(formData.memberId)) {
        onFormDataChange({ memberId: '' });
      }
    }
  }, [formData.role, roleMembers, isRemoveAction, formData.memberId, onFormDataChange]);

  // For remove action, validate member is in role
  useEffect(() => {
    if (isRemoveAction && formData.memberId && formData.role) {
      const isValidMember = roleMembers.includes(formData.memberId);
      onValidationChange?.('memberId', isValidMember);
    }
  }, [isRemoveAction, formData.memberId, formData.role, roleMembers, onValidationChange]);

  return (
    <div className="space-y-4">
      <div className="text-sm font-medium text-foreground">
        {isRemoveAction ? 'Remove Member from Role' : 'Add Member to Role'}
      </div>

      {/* Role Selection - Show first for Remove so user picks role, then sees members */}
      {isRemoveAction && (
        <div className="space-y-1">
          <Label htmlFor="role" className="text-xs text-muted-foreground">Role</Label>
          <div className="relative flex items-center" ref={roleRef}>
            <button
              type="button"
              onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
              className="w-full h-12 bg-transparent border border-border rounded-full text-sm focus:outline-none focus:border-muted-foreground/50 px-4 flex items-center justify-between hover:border-muted-foreground/50 transition-colors"
            >
              <span className={formData.role ? 'text-foreground' : 'text-primary font-medium opacity-60'}>
                {formData.role ?? 'Select role...'}
              </span>
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            </button>

            {roleDropdownOpen && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-2xl shadow-dropdown p-3 z-10 min-w-[140px] animate-in fade-in slide-in-from-top-1 duration-150 max-h-48 overflow-y-auto">
                <div className="space-y-1">
                  {policy?.roles.filter(role => {
                    // Only show roles that have members (Group type with members)
                    if (typeof role.kind === 'string') return false;
                    const kind = role.kind as { Group?: string[] };
                    return kind.Group && kind.Group.length > 0;
                  }).map((role) => {
                    const kind = role.kind as { Group?: string[] };
                    const memberCount = kind.Group?.length ?? 0;
                    return (
                      <Button
                        key={role.name}
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          onFormDataChange({ role: role.name, memberId: '' });
                          setRoleDropdownOpen(false);
                        }}
                        className="w-full justify-between text-sm h-10 px-4 hover:text-primary transition-colors"
                      >
                        <span className="truncate">{role.name}</span>
                        <span className="flex items-center gap-2 flex-shrink-0">
                          <span className="text-xs text-muted-foreground">{memberCount} member{memberCount !== 1 ? 's' : ''}</span>
                          <Check className={`w-4 h-4 flex-shrink-0 ${formData.role === role.name ? 'text-verified' : 'text-transparent'}`} />
                        </span>
                      </Button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
          {validationErrors.role && (
            <p className="text-xs text-orange">{validationErrors.role}</p>
          )}
        </div>
      )}

      {/* Member Selection */}
      {isRemoveAction ? (
        // Dropdown for Remove - only show members of selected role
        <div className="space-y-1">
          <Label htmlFor="member" className="text-xs text-muted-foreground">Member to Remove</Label>
          <div className="relative flex items-center" ref={memberRef}>
            <button
              type="button"
              onClick={() => formData.role && setMemberDropdownOpen(!memberDropdownOpen)}
              disabled={!formData.role}
              className={`w-full h-12 bg-transparent border border-border rounded-full text-sm focus:outline-none focus:border-muted-foreground/50 px-4 flex items-center justify-between transition-colors ${
                formData.role ? 'hover:border-muted-foreground/50' : 'opacity-50 cursor-not-allowed'
              }`}
            >
              {formData.memberId ? (
                <span className="flex items-center gap-2 text-foreground text-sm">
                  <ProfileAvatar
                    accountId={formData.memberId}
                    size="sm"
                    profileImageUrl={getProfileImageUrl(formData.memberId)}
                  />
                  <span className="truncate">{formData.memberId}</span>
                </span>
              ) : (
                <span className="text-primary font-medium opacity-60">
                  {formData.role ? 'Select member...' : 'Select role first...'}
                </span>
              )}
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            </button>

            {memberDropdownOpen && roleMembers.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-2xl shadow-dropdown p-3 z-10 min-w-[140px] animate-in fade-in slide-in-from-top-1 duration-150 max-h-64 overflow-hidden flex flex-col">
                {/* Search input for large member lists */}
                {roleMembers.length > 5 && (
                  <div className="mb-2">
                    <SearchInput
                      ref={searchInputRef}
                      value={memberSearch}
                      onChange={setMemberSearch}
                      placeholder="Search members..."
                      className="h-9"
                    />
                  </div>
                )}
                
                <div className="space-y-1 overflow-y-auto">
                  {filteredMembers.length > 0 ? (
                    filteredMembers.map((member) => (
                        <Button
                          key={member}
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            onFormDataChange({ memberId: member });
                            setMemberDropdownOpen(false);
                            setMemberSearch('');
                          }}
                          className="w-full justify-between text-sm h-10 px-4 hover:text-primary transition-colors"
                        >
                          <span className="flex items-center gap-2">
                            <ProfileAvatar
                              accountId={member}
                              size="sm"
                              profileImageUrl={getProfileImageUrl(member)}
                            />
                            <span className="text-sm truncate max-w-[200px]">{member}</span>
                          </span>
                          <Check className={`w-5 h-5 flex-shrink-0 ${formData.memberId === member ? 'text-verified' : 'text-transparent'}`} strokeWidth={2.5} />
                        </Button>
                      ))
                  ) : (
                    <p className="text-xs text-muted-foreground text-center py-2">
                      No members found
                    </p>
                  )}
                </div>
              </div>
            )}

            {memberDropdownOpen && roleMembers.length === 0 && formData.role && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-2xl shadow-dropdown p-4 z-10 animate-in fade-in slide-in-from-top-1 duration-150">
                <p className="text-xs text-muted-foreground text-center">
                  No members in this role
                </p>
              </div>
            )}
          </div>
          {validationErrors.memberId && (
            <p className="text-xs text-orange">{validationErrors.memberId}</p>
          )}
        </div>
      ) : (
        // Address input for Add - validate NEAR address exists
        <AddressInput
          id="member"
          value={formData.memberId ?? ''}
          onChange={(value) => onFormDataChange({ memberId: value })}
          placeholder="Enter member address"
          label="Member Address"
          error={validationErrors.memberId}
          onValidationChange={(exists) => onValidationChange?.('memberId', exists)}
        />
      )}

      {/* Role Selection for Add - show after member input */}
      {!isRemoveAction && (
        <div className="space-y-1">
          <Label htmlFor="role" className="text-xs text-muted-foreground">Role</Label>
          <div className="relative flex items-center" ref={roleRef}>
            <button
              type="button"
              onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
              className="w-full h-12 bg-transparent border border-border rounded-full text-sm focus:outline-none focus:border-muted-foreground/50 px-4 flex items-center justify-between hover:border-muted-foreground/50 transition-colors"
            >
              <span className={formData.role ? 'text-foreground' : 'text-primary font-medium opacity-60'}>
                {formData.role ?? 'Select role...'}
              </span>
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            </button>

            {roleDropdownOpen && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-2xl shadow-dropdown p-3 z-10 min-w-[140px] animate-in fade-in slide-in-from-top-1 duration-150 max-h-48 overflow-y-auto">
                <div className="space-y-1">
                  {policy?.roles.filter(role => role.kind !== 'Everyone').map((role) => (
                    <Button
                      key={role.name}
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        onFormDataChange({ role: role.name });
                        setRoleDropdownOpen(false);
                      }}
                      className="w-full justify-between text-sm h-10 px-4 hover:text-primary transition-colors"
                    >
                      <span className="truncate">{role.name}</span>
                      <Check className={`w-4 h-4 flex-shrink-0 ${formData.role === role.name ? 'text-verified' : 'text-transparent'}`} />
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </div>
          {validationErrors.role && (
            <p className="text-xs text-orange">{validationErrors.role}</p>
          )}
        </div>
      )}
    </div>
  );
}